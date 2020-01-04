import { getLogger } from 'log4js';
import { JsonController, Get } from 'routing-controllers';
import { Service } from 'typedi';
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
    return Object.keys(Poker.runningPokers).map(key => Poker.runningPokers[key].room);
  }

}
