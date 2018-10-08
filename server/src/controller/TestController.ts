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
import { Repository, getManager } from 'typeorm';
import { EntityFromParam, EntityFromBody } from 'typeorm-routing-controllers-extensions';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { User, Room } from '../entity';
import { UserRepository, RoomRepository } from '../repository';

@Service()
@JsonController()
export class TestController {

  // private userRepository = getManager().getRepository(User);

  // private roomRepository = getManager().getRepository(Room);

  // @InjectRepository(User)
  // private userRepository: Repository<User>;

  // @InjectRepository(Room)
  // private roomRepository: Repository<Room>;

  @InjectRepository(User)
  private userRepository: UserRepository;

  @InjectRepository(Room)
  private roomRepository: RoomRepository;

  @Get('/test/users')
  getUsers(): Promise<User[]> {
    return this.userRepository.find();
  }

  @Get('/test/users/:id')
  getUser(@EntityFromParam('id') user: User): User {
    // return this.userRepository.findOne(id);
    return user;
  }

  @Post('/test/users')
  createUser(@EntityFromBody() user: User): Promise<User> {
    return this.userRepository.save(user);
  }

  @Put('/test/users')
  updateUser(@EntityFromBody() user: User): Promise<User> {
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
  async createRoom(@Body() room: Room, @CurrentUser({ required: true }) user: User): Promise<Room> {
    console.log(user);
    const user2 = await this.userRepository.findOne(1);
    room.creator = user2;
    room.updater = user2;
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
