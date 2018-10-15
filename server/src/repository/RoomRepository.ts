import { Service } from 'typedi';
import { Repository, EntityRepository, getManager } from 'typeorm';
import { Room, User, Story, UserRoom, Score } from '../entity';

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
        (COUNT(ISNULL(story.score)) = COUNT(story.score)) AS isCompleted
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
    const cached = await this.getCachedRoom(id);
    const room = { ...cached.room };
    const stories = room.stories;
    room.isHost = room.userRooms.find(ur => ur.user.id === user.id).isHost;
    room.isCreator = room.creator.id === user.id;
    room.isCompleted = true;
    room.storyCount = 0;
    room.scoreSum = 0;
    room.timerSum = 0;
    room.stories = [];
    stories.forEach(s => {
      if (!s.isDeleted) {
        const story = { ...s };
        if (s.score !== null) {
          story.displayTimer = this.formatTimer(story.timer);
          room.stories.push(story);
          room.scoreSum += s.score;
          room.timerSum += s.timer;
        } else {
          room.isCompleted = false;
        }
        room.storyCount++;
      }
    });
    if (room.currentStory) {
      room.selectedCard = room.currentStory.scores.find(s => s.user.id === user.id).card;
    }

    room.displayTimerSum = this.formatTimer(room.timerSum);
    return room;
  }

  private async getCachedRoom(id: number, force: boolean = false): Promise<ICachedRoom> {
    if (!this.runningRooms.hasOwnProperty(id) || force) {
      const room = await this.findOneOrFail(id, {
        relations: ['userRooms', 'userRooms.user', 'stories', 'stories.scores', 'stories.scores.user', 'creator', 'updater'],
      });
      room.calcMethod = 0;
      room.subCalcMethod = 0;
      this.runningRooms[id] = { room };
    }

    return this.runningRooms[id];
  }

  private async startNextStory(cached: ICachedRoom, users: User[]) {
    cached.room.currentStory = cached.room.stories.find(s => !s.isDeleted && s.score === null);
    if (cached.room.currentStory) {
      if (!cached.timer) {
        cached.timer = setInterval(() => {
          cached.room.currentStory.timer++;
        }, 1000);
      }

      cached.room.currentStory.scores.forEach(score => {
        if (score.card !== null || score.card !== undefined) {
          switch (score.card) {
            case -1: score.displayCard = '?'; break;
            case -2: score.displayCard = 'C'; break;
            default: score.displayCard = score.card.toString(); break;
          }
        }
      });

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
    } else {
      if (cached.timer) {
        clearInterval(cached.timer);
        delete cached.timer;
      }
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

}
