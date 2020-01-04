// tslint:disable
import { Service } from 'typedi';
import { Repository, EntityRepository, getManager } from 'typeorm';
import { Room, User, Story, UserRoom, Score } from '../entity';
import { formatTimer, convertScore } from '../util';

@Service()
@EntityRepository(Room)
export class RoomRepository extends Repository<Room> {

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

}
