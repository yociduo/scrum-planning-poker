import * as jwt from 'jsonwebtoken';
import { Middleware, MiddlewareInterface } from 'socket-controllers';
import { config } from '../../config';

@Middleware()
export class AuthenitificationMiddleware implements MiddlewareInterface {

  use(socket: any, next: ((err?: any) => any)): any {
    const { token } = socket.handshake.query;
    try {
      socket.userId = Number(jwt.verify(token, config.jwtSecret));
    } catch {}

    next();
  }

}
