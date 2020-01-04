import {
  JsonController,
  Get,
  Post,
  Body,
  CurrentUser,
  Authorized,
  Param,
} from 'routing-controllers';
import { Service } from 'typedi';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { Room, User } from '../../entity';
import { RoomRepository } from '../../repository';

@Service()
@JsonController('/rooms')
export class RoomController {

  @InjectRepository(Room)
  private roomRepository: RoomRepository;

  @Authorized()
  @Get()
  getList(@CurrentUser({ required: true }) user: User): Promise<Room[]> {
    return this.roomRepository.getListByUser(user);
  }

  @Authorized()
  @Get('/:id')
  get(@CurrentUser({ required: true }) user: User, @Param('id') id: number): Promise<Room> {
    return this.roomRepository.getByUser(id, user);
  }

  @Authorized()
  @Get('/:id/check')
  check(@Param('id') id: number): Promise<boolean> {
    return this.roomRepository.check(id);
  }

  @Authorized()
  @Post()
  create(@CurrentUser({ required: true }) user: User, @Body() room: Room): Promise<Room> {
    return this.roomRepository.createWithStory(user, room);
  }

}
