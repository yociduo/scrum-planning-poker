import { JsonController, Get } from 'routing-controllers';
import { Service } from 'typedi';

@Service()
@JsonController()
export class TestController {
  constructor() {
  }

  @Get('/test')
  test() {
    return 'test';
  }
}
