import { Service } from 'typedi';
import { Repository, EntityRepository, getManager } from 'typeorm';
import { Room, User, Story, UserRoom, Score } from '../entity';

const initResults = new Array(31).fill(null).map((v, i) => i).concat([0.5, 40, 55, 89, 100]).sort((i, j) => i - j);

export interface ICachedRoom {
  room: Room;
  timer?: NodeJS.Timer;
}

@Service()
@EntityRepository(Room)
export class RoomRepository extends Repository<Room> {

  private runningRooms: { [key: number]: ICachedRoom } = {};

  async getByUser(user: User): Promise<Room[]> {
    return await getManager().query(`
      SELECT
        room.id AS id,
        room.name AS name,
        room.createdAt AS createdAt,
        room.updatedAt AS updatedAt,
        (room.creatorId = ?) AS isCreator,
        COUNT(story.id) AS storyCount,
        IFNULL(SUM(story.score), 0) AS scoreSum,
        SUM(story.timer) AS timerSum,
        SUM(!story.isCompleted) = 0 AS isCompleted
      FROM UserRooms userRoom
      LEFT JOIN Rooms room ON room.id = userRoom.roomId
      LEFT JOIN Stories story ON story.roomId = room.id
      WHERE userRoom.userId = ?
      AND room.isDeleted = false
      AND story.isDeleted = false
      GROUP BY userRoom.roomId
      ORDER BY room.createdAt DESC
    `, [user.id, user.id]);

    // return (await getManager()
    //   .createQueryBuilder(UserRoom, 'userRoom')
    //   .leftJoinAndSelect('userRoom.room', 'room')
    //   .leftJoin('room.stories', 'story')
    //   .where('userRoom.userId = :id', { id: user.id })
    //   .andWhere('room.isDeleted = false')
    //   .andWhere('story.isDeleted = false')
    //   .orderBy('room.createdAt', 'DESC')
    //   .addSelect('COUNT(story.score)', 'storyCount')
    //   .groupBy('room.id')
    //   .getMany())
    //   .map(ur => ur.room);
  }

  async createWithStory(user: User, room: Room): Promise<Room> {
    const newRoom = new Room();
    await getManager().transaction(async (transactionalEntityManager) => {
      newRoom.name = room.name;
      newRoom.options = room.options;
      newRoom.creator = user;
      newRoom.updater = user;
      await transactionalEntityManager.insert(Room, newRoom);

      for (let i = 0; i < room.stories.length; i++) {
        const newStory = new Story();
        newStory.name = room.stories[i].name;
        newStory.room = newRoom;
        newStory.creator = user;
        newStory.updater = user;
        await transactionalEntityManager.insert(Story, newStory);
      }
    });
    return newRoom;
  }

  async joinOrLeave(id: number, user: User, isLeft: boolean = false): Promise<void> {
    const cached = await this.getCachedRoom(id);
    const { room, timer } = cached;
    let userRoom = room.userRooms.find(ur => ur.user.id === user.id);

    const exist = !!userRoom;
    if (!exist) {
      userRoom = new UserRoom();
      userRoom.user = user;
      userRoom.room = room;
      userRoom.isHost = room.creator.id === user.id;
    }

    userRoom.isLeft = isLeft;
    await getManager().save(UserRoom, userRoom);
    if (!exist) {
      delete userRoom.room;
      room.userRooms.push(userRoom);
    }

    if (room.userRooms.every(r => r.isLeft)) {
      if (room.currentStory) {
        await getManager().save(Story, room.currentStory);
      }
      if (timer) {
        clearInterval(timer);
      }
      delete this.runningRooms[id];
    } else if (!room.currentStory) {
      await this.startNextStory(cached, [user]);
    }
  }

  async getRoomDetail(id: number, user: User): Promise<Room> {
    const { room } = await this.getCachedRoom(id);
    room.isHost = room.userRooms.find(ur => ur.user.id === user.id).isHost;
    room.isCreator = room.creator.id === user.id;

    if (room.currentStory) {
      const score = room.currentStory.scores.find(s => s.user.id === user.id);
      room.selectedCard = score ? score.card : null;
    }

    return room;
  }

  async selectCard(id: number, user: User, card: number): Promise<Room> {
    const cached = await this.getCachedRoom(id);
    if (cached.room.currentStory) {
      const score = cached.room.currentStory.scores.find(s => s.user.id === user.id);
      score.card = card;
      score.timer = cached.room.currentStory.timer;
      await getManager().save(Score, score);
      this.convertScore(score);
      this.calculator(cached.room);
      return cached.room;
    }

    return null;
  }

  async calcMethod(id: number, calcMethod: number): Promise<Room> {
    const cached = await this.getCachedRoom(id);
    cached.room.options.calcMethod = calcMethod;
    await getManager().save(Room, cached.room);
    this.calculator(cached.room);
    return cached.room;
  }

  async nextStory(id: number): Promise<Room> {
    const cached = await this.getCachedRoom(id);
    const { userRooms, options, currentStory, currentScore } = cached.room;
    const users = userRooms.filter(ur => !ur.isLeft && (!ur.isHost || options.needScore)).map(ur => ur.user);
    if (currentStory) {
      currentStory.score = initResults[currentScore];
      currentStory.isCompleted = true;
      await getManager().save(Story, currentStory);
      cached.room.scoreSum += currentStory.score;
      cached.room.timerSum += currentStory.timer;
      cached.room.displayTimerSum = this.formatTimer(cached.room.timerSum);
    }

    await this.startNextStory(cached, users);
    return cached.room;
  }

  async changeCurrentScore(id: number, currentScore: number): Promise<Room> {
    const cached = await this.getCachedRoom(id);
    cached.room.options.calcMethod = 3;
    cached.room.currentScore = currentScore;
    await getManager().save(Room, cached.room);
    return cached.room;
  }

  async addStory(id: number, stories: Story[], user: User): Promise<Room> {
    const room = await this.findOne(id);
    await getManager().transaction(async (transactionalEntityManager) => {
      for (let i = 0; i < stories.length; i++) {
        const newStory = new Story();
        newStory.name = stories[i].name;
        newStory.room = room;
        newStory.creator = user;
        newStory.updater = user;
        await transactionalEntityManager.insert(Story, newStory);
      }
    });
    await this.getCachedRoom(id, true);
    return await this.nextStory(id);
  }

  private async getCachedRoom(id: number, force: boolean = false): Promise<ICachedRoom> {
    if (!this.runningRooms.hasOwnProperty(id) || force) {
      const room = await this.findOneOrFail(id, {
        relations: ['userRooms', 'userRooms.user', 'stories', 'stories.scores', 'stories.scores.user', 'creator', 'updater'],
      });
      room.isCompleted = true;
      room.storyCount = 0;
      room.scoreSum = 0;
      room.timerSum = 0;
      room.stories.forEach(story => {
        story.displayTimer = this.formatTimer(story.timer);
        if (!story.isDeleted) {
          if (story.isCompleted !== null) {
            room.scoreSum += story.score;
            room.timerSum += story.timer;
          } else {
            room.isCompleted = false;
          }
          room.storyCount++;
        }
      });
      room.displayTimerSum = this.formatTimer(room.timerSum);

      this.runningRooms[id] = { room };
    }

    return this.runningRooms[id];
  }

  private async startNextStory(cached: ICachedRoom, users: User[]) {
    cached.room.currentScore = null;
    cached.room.currentStory = cached.room.stories.find(s => !s.isDeleted && !s.isCompleted);
    cached.room.selectedCard = null;
    if (cached.room.currentStory) {
      cached.room.isCompleted = false;
      cached.room.currentStory.displayTimer = this.formatTimer(cached.room.currentStory.timer);
      if (!cached.timer) {
        cached.timer = setInterval(() => {
          cached.room.currentStory.timer++;
          cached.room.currentStory.displayTimer = this.formatTimer(cached.room.currentStory.timer);
        }, 1000);
      }

      cached.room.currentStory.scores.forEach(this.convertScore);

      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const exist = cached.room.currentStory.scores.some(s => s.user.id === user.id);
        if (!exist) {
          const score = new Score();
          score.user = user;
          score.story = cached.room.currentStory;
          await getManager().save(Score, score);
          delete score.story;
          cached.room.currentStory.scores.push(score);
        }
      }

      this.calculator(cached.room);

    } else {
      cached.room.currentStory = null;
      cached.room.isCompleted = true;
      if (cached.timer) {
        clearInterval(cached.timer);
        delete cached.timer;
      }
    }
  }

  private calculator = (room: Room) => {
    const { options: { calcMethod }, currentStory } = room;
    if (currentStory) {
      if (calcMethod === 3) {
        return;
      }

      const scores = currentStory.scores.map(s => s.card).filter(s => s && s >= 0).sort((a, b) => a - b);

      if (scores.length === 0) {
        room.currentScore = null;
        return;
      } else if (scores.length > 2 && calcMethod === 1) {
        scores.pop();
        scores.splice(0, 1);
      }

      const { length } = scores;

      let result: number;

      if (calcMethod === 0) {
        result = scores.reduce((v, s) => v + s, 0) / length;
      } else {
        result = length % 2 === 0 ?
          Math.round((scores[length / 2] + scores[length / 2 - 1]) / 2) : scores[(length - 1) / 2]
      }

      room.currentScore = initResults.map((value, index) => ({
        value,
        index,
        abs: Math.abs(value - result)
      })).sort((i, j) => {
        if (i.abs > j.abs) {
          return 1;
        } else if (i.abs < j.abs) {
          return -1;
        } else {
          return j.value - i.value;
        }
      })[0].index;
    }
  }

  private formatTimer(timer: number): string {
    const hour = Math.floor(timer / 3600);
    const minute = Math.floor((timer % 3600) / 60);
    const second = timer % 60;
    return `${this.formatNumber(hour)}:${this.formatNumber(minute)}:${this.formatNumber(second)}`;
  }

  private formatNumber(n: number): string {
    const ns = n.toString()
    return ns[1] ? ns : '0' + ns;
  }

  private convertScore = (score: Score) => {
    switch (score.card) {
      case -1: score.displayCard = '?'; break;
      case -2: score.displayCard = 'C'; break;
      case null:
      case undefined: score.displayCard = null; break;
      default: score.displayCard = score.card.toString(); break;
    }
  }

}
