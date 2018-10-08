import { JsonController, Get, Param, Post, Body, Put } from 'routing-controllers';
import { Service } from 'typedi';
import { User, Room, UserRoom } from '../entity';
import { UserRepository, RoomRepository } from '../repository';

@Service()
@JsonController()
export class TestController {

  constructor(
    private roomRepository: RoomRepository,
    private userRepository: UserRepository,
  ) {

  }

  @Get('/test/users')
  getUsers(): Promise<User[]> {
    return this.userRepository.find();
  }

  @Get('/test/users/:id')
  getUser(@Param('id') id: number): Promise<User> {
    return this.userRepository.findOne(id);
  }

  @Post('/test/users')
  createUser(@Body() user: User): Promise<User> {
    return this.userRepository.save(user);
  }

  @Put('/test/users')
  updateUser(@Body() user: User): Promise<User> {
    return this.userRepository.save(user);
  }

  @Get('/test/rooms')
  getRooms(): Promise<Room[]> {
    return this.roomRepository.find();
  }

  @Get('/test/rooms/:id')
  getRoom(@Param('id') id: number): Promise<Room> {
    return this.roomRepository.findOne(id);
  }

  @Post('/test/rooms')
  async createRoom(@Body() room: Room): Promise<Room> {
    const user = await this.userRepository.findOne(1);
    room.creator = user;
    room.updater = user;
    return this.roomRepository.save(room);
  }

  // @Get('/test/rooms/:id/:name')
  // async createRoom(@Param('id') id: number, @Param('name') name: string) {
  //   const user = await this.userRepository.findOne(id);
  //   const room = new Room();
  //   room.creator = user;
  //   room.updater = user;
  //   room.name = name;

  //   await getManager().transaction(async (transactionalEntityManager) => {
  //     await transactionalEntityManager.save(room);
  //     const userRoom = new UserRoom();
  //     userRoom.isHost = true;
  //     userRoom.isLeft = false;
  //     userRoom.user = user;
  //     userRoom.room = room;
  //     await transactionalEntityManager.save(userRoom);
  //   });

  //   return room;
  // }

}
