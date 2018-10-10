import { JsonController, Get, Post, Body, CurrentUser, Authorized } from 'routing-controllers';
import { Service } from 'typedi';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { Room, User } from '../entity';
import { RoomRepository } from '../repository';

@Service()
@JsonController('/api/rooms')
export class RoomController {

  @InjectRepository(Room)
  private roomRepository: RoomRepository;

  @Authorized()
  @Post()
  create(@CurrentUser({ required: true }) user: User, @Body() room: Room): Promise<Room> {
    return this.roomRepository.createRoomWithStory(user, room);
  }

}
