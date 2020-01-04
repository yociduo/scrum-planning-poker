// tslint:disable
import { Service } from 'typedi';
import { Repository, EntityRepository, getManager } from 'typeorm';
import { Room, User, Story, UserRoom, Score } from '../entity';
import { formatTimer, convertScore, Poker } from '../util';

const initResults = new Array(31).fill(null).map((v, i) => i).concat([0.5, 40, 55, 89, 100]).sort((i, j) => i - j);

export interface ICachedRoom {
  room: Room;
  timer?: NodeJS.Timer;
}

@Service()
@EntityRepository(Room)
export class RoomRepository extends Repository<Room> {

  public static runningRooms: { [key: number]: ICachedRoom } = {};

  async getListByUser(user: User): Promise<Room[]> {
    return await getManager().query(`
      SELECT
        room.id AS id,
        room.name AS name,
        room.createdAt AS createdAt,
        room.updatedAt AS updatedAt,
        userRoom.isHost AS isHost,
        (room.creatorId = ?) AS isCreator,
        SUM(!story.isCompleted) = 0 AS isCompleted,
        COUNT(story.id) AS storyCount,
        IFNULL(SUM(story.score), 0) AS scoreSum,
        SUM(story.timer) AS timerSum
      FROM UserRooms userRoom
      INNER JOIN Rooms room ON room.id = userRoom.roomId
      LEFT JOIN Stories story ON story.roomId = room.id
      WHERE userRoom.userId = ?
      AND room.isDeleted = false
      AND story.isDeleted = false
      GROUP BY userRoom.roomId, userRoom.isHost
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

  async getByUser(id: number, user: User): Promise<Room> {
    const room = await getManager().findOneOrFail(Room, {
      relations: [
        'stories',
        'stories.scores',
        'stories.scores.user',
      ],
      where: {
        id,
      },
    });

    room.storyCount = 0;
    room.timerSum = 0;
    room.scoreSum = 0
    room.stories.forEach(story => {
      story.displayTimer = formatTimer(story.timer);
      room.storyCount++;
      room.timerSum += story.timer;
      room.scoreSum += story.score;
    });
    room.displayTimerSum = formatTimer(room.timerSum);

    return room;
  }

  async check(id: number): Promise<boolean> {
    return (await this.createQueryBuilder('room')
      .leftJoin('room.stories', 'story')
      .where('room.id = :id', { id })
      .andWhere('story.isDeleted = false')
      .groupBy('room.id')
      .having('COUNT(story.id) = SUM(story.isCompleted)')
      .getCount()) > 0;
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
    const userRoom = await this.createUserRoom(cached, user, isLeft);

    if (room.userRooms.every(r => r.isLeft)) {
      if (room.currentStory) {
        await getManager().save(Story, room.currentStory);
      }
      if (timer) {
        clearInterval(timer);
      }
      delete RoomRepository.runningRooms[id];
    } else {
      if (room.currentStory) {
        if (room.options.needScore || !userRoom.isHost) {
          await this.createScore(cached, user);
        }
      } else {
        await this.startNextStory(cached, room.options.needScore || !userRoom.isHost ? [user] : []);
      }
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
      score.displayCard = convertScore(score.card);
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
    if (currentStory) {
      currentStory.score = initResults[currentScore];
      currentStory.isCompleted = true;
      await getManager().save(Story, currentStory);
      cached.room.scoreSum += currentStory.score;
      cached.room.timerSum += currentStory.timer;
      cached.room.displayTimerSum = formatTimer(cached.room.timerSum);
    }

    const users = userRooms.filter(ur => !ur.isLeft && (!ur.isHost || options.needScore)).map(ur => ur.user);
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
    if (!RoomRepository.runningRooms.hasOwnProperty(id) || force) {
      const room = await this.findOneOrFail(id, {
        relations: ['userRooms', 'userRooms.user', 'stories', 'stories.scores', 'stories.scores.user', 'creator', 'updater'],
      });
      room.isCompleted = true;
      room.storyCount = 0;
      room.scoreSum = 0;
      room.timerSum = 0;
      room.stories.forEach(story => {
        story.displayTimer = formatTimer(story.timer);
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
      room.displayTimerSum = formatTimer(room.timerSum);

      RoomRepository.runningRooms[id] = { room };
    }

    return RoomRepository.runningRooms[id];
  }

  private async startNextStory(cached: ICachedRoom, users: User[]) {
    cached.room.currentScore = null;
    cached.room.currentStory = cached.room.stories.find(s => !s.isDeleted && !s.isCompleted);
    cached.room.selectedCard = null;
    if (cached.room.currentStory) {
      cached.room.isCompleted = false;
      cached.room.currentStory.displayTimer = formatTimer(cached.room.currentStory.timer);
      if (!cached.timer) {
        cached.timer = setInterval(() => {
          cached.room.currentStory.timer++;
          cached.room.currentStory.displayTimer = formatTimer(cached.room.currentStory.timer);
        }, 1000);
      }

      cached.room.currentStory.scores.forEach(s => s.displayCard = convertScore(s.card));

      for (let i = 0; i < users.length; i++) {
        await this.createScore(cached, users[i]);
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

  private async createUserRoom(cached: ICachedRoom, user: User, isLeft: boolean): Promise<UserRoom> {
    let userRoom = cached.room.userRooms.find(ur => ur.user.id === user.id);

    const exist = !!userRoom;
    if (!exist) {
      userRoom = new UserRoom();
      userRoom.user = user;
      userRoom.room = cached.room;
      userRoom.isHost = cached.room.creator.id === user.id;
    }

    userRoom.isLeft = isLeft;
    await getManager().save(UserRoom, userRoom);
    if (!exist) {
      delete userRoom.room;
      cached.room.userRooms.push(userRoom);
    }

    return userRoom;
  }

  private async createScore(cached: ICachedRoom, user: User): Promise<void> {
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

  private calculator = (room: Room) => {
    const { options: { calcMethod }, currentStory } = room;
    if (currentStory) {
      if (calcMethod === 3) {
        return;
      }

      const scores = currentStory.scores.map(s => s.card).filter(s => s !== null && s >= 0).sort((a, b) => a - b);

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
          Math.round((scores[length / 2] + scores[length / 2 - 1]) / 2) : scores[(length - 1) / 2];
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

}
