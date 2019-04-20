import { JsonController, Get } from 'routing-controllers';
import { Service } from 'typedi';

@Service()
@JsonController()
export class HomeController {

  @Get()
  index() {
    return 'Hello World';
  }

}
