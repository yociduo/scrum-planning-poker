import {
  JsonController,
  Get,
  Param,
  Post,
  Body,
  Put,
  Authorized,
  CurrentUser,
} from 'routing-controllers';
import { Service } from 'typedi';
import { EntityFromParam, EntityFromBody } from 'typeorm-routing-controllers-extensions';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { User, Room } from '../entity';
import { WxLogin } from '../model';
import { UserRepository, RoomRepository } from '../repository';

@Service()
@JsonController()
export class TestController {

  @InjectRepository(User)
  private userRepository: UserRepository;

  @InjectRepository(Room)
  private roomRepository: RoomRepository;

  @Post('/test/wxlogin')
  login(@Body() data: WxLogin): Promise<string> {
    return this.userRepository.wxLogin(data);
  }

  @Authorized()
  @Get('/test/users')
  getUsers(): Promise<User[]> {
    return this.userRepository.find();
  }

  @Authorized()
  @Get('/test/users/:id')
  getUser(@EntityFromParam('id') user: User): User {
    // return this.userRepository.findOne(id);
    return user;
  }

  @Authorized()
  @Post('/test/users')
  createUser(@EntityFromBody() user: User): Promise<User> {
    return this.userRepository.save(user);
  }

  @Authorized()
  @Put('/test/users')
  updateUser(@EntityFromBody() user: User): Promise<User> {
    return this.userRepository.save(user);
  }

  @Authorized()
  @Get('/test/rooms')
  getRooms(): Promise<Room[]> {
    return this.roomRepository.find();
  }

  @Authorized()
  @Get('/test/rooms/:id')
  getRoom(@Param('id') id: number): Promise<Room> {
    return this.roomRepository.findOne(id);
  }

  @Authorized()
  @Post('/test/rooms')
  async createRoom(@Body() room: Room, @CurrentUser({ required: true }) user: User): Promise<Room> {
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
