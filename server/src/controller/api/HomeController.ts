import { getLogger } from 'log4js';
import { JsonController, Get } from 'routing-controllers';
import { Service } from 'typedi';

const logger = getLogger('home');

@Service()
@JsonController()
export class HomeController {

  @Get()
  index() {
    logger.info('hello world');
    return 'Hello World';
  }

}
