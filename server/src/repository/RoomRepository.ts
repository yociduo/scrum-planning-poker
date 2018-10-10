import { Service } from 'typedi';
import { Repository, EntityRepository, getManager } from 'typeorm';
import { Room, User, Story, UserRoom } from '../entity';

@Service()
@EntityRepository(Room)
export class RoomRepository extends Repository<Room> {

  async getByUser(user: User): Promise<Room[]> {
    return (await getManager()
      .createQueryBuilder(UserRoom, 'userRoom')
      .leftJoinAndSelect('userRoom.room', 'room')
      .leftJoinAndSelect('room.users', 'roomUser')
      .leftJoinAndSelect('room.stories', 'story')
      .leftJoinAndSelect('roomUser.user', 'user')
      .where('userRoom.userId = :id', { id: user.id })
      .orderBy('room.createdAt', 'DESC')
      .getMany())
      .map(ur => ur.room);
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
    const room = await this.findOne(id, { relations: ['creator'] });
    if (!room) {
      return false;
    }

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
