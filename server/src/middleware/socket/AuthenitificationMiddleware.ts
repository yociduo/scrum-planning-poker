import { getLogger } from 'log4js';
import { Middleware, MiddlewareInterface } from 'socket-controllers';
import { getManager } from 'typeorm';
import { User } from '../../entity';
import { Socket, verify } from '../../util';

const logger = getLogger('logging');

@Middleware()
export class AuthenitificationMiddleware implements MiddlewareInterface {

  async use(socket: Socket, next: ((err?: any) => any)) {
    const { token } = socket.handshake.query;
    try {
      const userId = verify(token);
      socket.user = await getManager().getRepository(User).findOne(userId);
      next();
    } catch (error) {
      if (error) {
        switch (error.message) {
          case 'jwt expired':
            break;
          default:
            logger.error('Authenitification Middleware Error', error);
            break;
        }
      }
      next(error);
    }
  }

}
