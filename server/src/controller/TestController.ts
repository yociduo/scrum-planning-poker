import { JsonController, Get, Param } from 'routing-controllers';
import { Service } from 'typedi';
import { getManager } from 'typeorm';
import { User, Room, UserRoom } from '../entity';

@Service()
@JsonController()
export class TestController {

  private userRepository = getManager().getRepository(User);

  private roomRepository = getManager().getRepository(Room);

  private userRoomRepository = getManager().getRepository(UserRoom);

  @Get('/test/users')
  userList(): Promise<User[]> {
    return this.userRepository.find();
  }

  @Get('/test/users-create')
  user(): Promise<User> {
    return this.userRepository.save(new User());
  }

  @Get('/test/users/:id')
  findUser(@Param('id') id: number): Promise<User> {
    return this.userRepository.findOne(id);
  }

  @Get('/test/rooms/:id/:name')
  async createRoom(@Param('id') id: number, @Param('name') name: string) {
    const user = await this.userRepository.findOne(id);
    const room = new Room();
    room.creator = user;
    room.updater = user;
    room.name = name;

    await getManager().transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.save(room);
      const userRoom = new UserRoom();
      userRoom.isHost = true;
      userRoom.isLeft = false;
      userRoom.user = user;
      userRoom.room = room;
      await transactionalEntityManager.save(userRoom);
    });

    return room;
  }

}
