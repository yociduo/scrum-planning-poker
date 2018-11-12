import { Middleware, KoaMiddlewareInterface } from 'routing-controllers';
import { Context } from 'koa';

@Middleware({ type: 'before' })
export class LoggingMiddleware implements KoaMiddlewareInterface {

  async use(context: Context, next: (err?: any) => Promise<any>): Promise<any> {
    await next();
    if (context.res.statusCode === 500) {
      console.error('Internal Server Error: ', context.body);
    }
  }

}
