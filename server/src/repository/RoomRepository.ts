import { Service } from 'typedi';
import { Repository, EntityRepository, getManager } from 'typeorm';
import { Room, User, Story, UserRoom } from '../entity';

@Service()
@EntityRepository(Room)
export class RoomRepository extends Repository<Room> {

  async getByUser(user: User): Promise<any> {
    return await getManager().query(`
      SELECT
        room.id AS id,
        room.name AS name,
        room.createdAt AS createdAt,
        room.updatedAt AS updatedAt,
        (room.creatorId = ?) AS isCreator,
        COUNT(story.score) AS storyCount,
        SUM(story.score) AS scoreSum,
        SUM(story.timer) AS timerSum,
        ((COUNT(ISNULL(story.score)) = COUNT(story.score)) = TRUE) AS isCompleted
      FROM test.UserRooms userRoom
      LEFT JOIN test.Rooms room ON room.id = userRoom.roomId
      LEFT JOIN test.Stories story ON story.roomId = room.id
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

  async joinOrLeave(id: number, user: User, isLeft: boolean = false): Promise<boolean> {
    const room = await this.findOneOrFail(id, { relations: ['creator'] });
    let userRoom = await getManager().findOne(UserRoom, { where: { user, room } });

    if (!userRoom) {
      userRoom = new UserRoom();
      userRoom.user = user;
      userRoom.room = room;
    }

    userRoom.isHost = room.creator.id === user.id;
    userRoom.isLeft = isLeft;
    await getManager().save(UserRoom, userRoom);
    return true;
  }

}
