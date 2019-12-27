import { JsonController, Get, QueryParam } from 'routing-controllers';
import { Service } from 'typedi';
import { checkSignature } from '../../util';

@Service()
@JsonController('/messages')
export class MessageController {

  @Get('/signature')
  signature(
    @QueryParam('signature') signature: string,
    @QueryParam('timestamp') timestamp: string,
    @QueryParam('nonce') nonce: string,
    @QueryParam('echostr') echostr: string,
  ) {
    return checkSignature(signature, timestamp, nonce) ? echostr : null;
  }

}
