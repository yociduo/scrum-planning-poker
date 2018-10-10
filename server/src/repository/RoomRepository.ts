import { Service } from 'typedi';
import { Repository, EntityRepository, getManager } from 'typeorm';
import { Room, User, Story } from '../entity';

@Service()
@EntityRepository(Room)
export class RoomRepository extends Repository<Room> {

  async createRoomWithStory(user: User, room: Room): Promise<Room> {
    const newRoom = new Room();
    await getManager().transaction(async (transactionalEntityManager) => {
      newRoom.name = room.name;
      newRoom.options = room.options;
      newRoom.creator = user;
      newRoom.updater = user;
      await transactionalEntityManager.save(newRoom);

      for (let i = 0; i < room.stories.length; i++) {
        const newStore = new Story();
        newStore.name = room.stories[i].name;
        newStore.room = newRoom;
        newStore.creator = user;
        newStore.updater = user;
        await transactionalEntityManager.save(newStore);
      }
    });
    return newRoom;
  }

}
