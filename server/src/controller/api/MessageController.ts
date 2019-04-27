import { JsonController, Get, QueryParam } from 'routing-controllers';
import { Service } from 'typedi';
import { md } from 'node-forge';
import { config } from '../../config';

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
    const sha1 = md.sha1.create();
    sha1.update([config.jwtSecret, timestamp, nonce].sort().join(''));
    return sha1.digest().toHex() === signature ? echostr : null;
  }

}
