import * as jwt from 'jsonwebtoken';
import { getLogger } from 'log4js';
import { Middleware, MiddlewareInterface } from 'socket-controllers';
import { getManager } from 'typeorm';
import { config } from '../../config';
import { User } from '../../entity';
import { Socket } from '../../util';

const logger = getLogger('logging');

@Middleware()
export class AuthenitificationMiddleware implements MiddlewareInterface {

  async use(socket: Socket, next: ((err?: any) => any)) {
    const { token } = socket.handshake.query;
    try {
      const userId = Number(jwt.verify(token, config.jwtSecret));
      socket.user = await getManager().getRepository(User).findOne(userId);
      next();
    } catch (error) {
      logger.error('', error);
      next(error);
    }
  }

}
