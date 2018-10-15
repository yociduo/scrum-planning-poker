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
import { Room, Score, Story, User } from '../../entity';
import { WxLogin } from '../../model';
import { RoomRepository, ScoreRepository, StoryRepository, UserRepository } from '../../repository';

@Service()
@JsonController('/test')
export class TestController {

  @InjectRepository(Room)
  private roomRepository: RoomRepository;

  @InjectRepository(Score)
  private scoreRepository: ScoreRepository;

  @InjectRepository(Story)
  private storyRepository: StoryRepository;

  @InjectRepository(User)
  private userRepository: UserRepository;

  @Get()
  test() {
    return 'Working!';
  }

  @Post('/wxlogin')
  login(@Body() data: WxLogin): Promise<string> {
    return this.userRepository.wxLogin(data);
  }

  @Authorized()
  @Get('/users')
  getUsers(): Promise<User[]> {
    return this.userRepository.find();
  }

  @Authorized()
  @Get('/users/:id')
  getUser(@EntityFromParam('id') user: User): User {
    // return this.userRepository.findOne(id);
    return user;
  }

  @Authorized()
  @Post('/users')
  createUser(@EntityFromBody() user: User): Promise<User> {
    return this.userRepository.save(user);
  }

  @Authorized()
  @Put('/users')
  updateUser(@EntityFromBody() user: User): Promise<User> {
    return this.userRepository.save(user);
  }

  @Authorized()
  @Get('/rooms')
  getRooms(@CurrentUser({ required: true }) user: User): Promise<Room[]> {
    return this.roomRepository.getByUser(user);
  }

  @Authorized()
  @Get('/rooms/:id')
  getRoom(@Param('id') id: number): Promise<Room> {
    return this.roomRepository.findOne(id);
  }

  @Authorized()
  @Post('/rooms')
  createRoom(@Body() room: Room, @CurrentUser({ required: true }) user: User): Promise<Room> {
    return this.roomRepository.createWithStory(user, room);
  }

  @Authorized()
  @Post('/rooms/:id/join')
  joinRoom(@Param('id') id: number, @CurrentUser({ required: true }) user: User): Promise<void> {
    return this.roomRepository.joinOrLeave(id, user);
  }

  @Authorized()
  @Post('/rooms/:id/leave')
  leaveRoom(@Param('id') id: number, @CurrentUser({ required: true }) user: User): Promise<void> {
    return this.roomRepository.joinOrLeave(id, user, true);
  }

  // @Get('/rooms/:id/:name')
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
