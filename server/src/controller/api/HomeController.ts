import { getLogger } from 'log4js';
import { JsonController, Get } from 'routing-controllers';
import { Service } from 'typedi';
import { RoomRepository } from '../../repository';
import { Poker } from '../../util';

const logger = getLogger('home');

@Service()
@JsonController()
export class HomeController {

  @Get()
  index() {
    // api health check and log check
    logger.info('hello world');
    return 'hello world';
  }

  // TODO: temp room health check
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
