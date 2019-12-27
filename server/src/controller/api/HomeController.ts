import { getLogger } from 'log4js';
import { JsonController, Get } from 'routing-controllers';
import { Service } from 'typedi';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { Room } from '../../entity';
import { RoomRepository } from '../../repository';
import { Poker } from '../../util';

const logger = getLogger('home');

@Service()
@JsonController()
export class HomeController {

  @InjectRepository(Room)
  private roomRepository: RoomRepository;

  @Get()
  index() {
    logger.info('hello world');
  }

  @Get('/room-health')
  roomHealth() {
    return {
      repository: Object.keys(RoomRepository.runningRooms).map((key) => {
        return RoomRepository.runningRooms[key].room;
      }),
      poker: Object.keys(Poker.runningPokers).map((key) => {
        return Poker.runningPokers[key].room;
      }),
    };
  }

}
