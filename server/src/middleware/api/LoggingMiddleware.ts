import { Context } from 'koa';
import { getLogger } from 'log4js';
import { Middleware, KoaMiddlewareInterface } from 'routing-controllers';

const logger = getLogger('logging');

@Middleware({ type: 'before' })
export class LoggingMiddleware implements KoaMiddlewareInterface {

  async use(context: Context, next: (err?: any) => Promise<any>): Promise<any> {
    await next();
    if (context.res.statusCode === 500) {
      logger.error('Internal Server Error: ', context.body);
    }
  }

}
