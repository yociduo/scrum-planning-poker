import 'reflect-metadata';
import { createKoaServer, useContainer as routingUseContainer } from 'routing-controllers';
import { Container } from 'typedi';
import { useContainer as ormUseContainer, createConnection } from 'typeorm';
import { config } from './config';
import { decorators } from './decorator';

/**
 * Setup routing-controllers to use typedi container.
 */
routingUseContainer(Container);
ormUseContainer(Container);

createConnection().then(async () => {
  /**
   * We create a new koa server instance.
   * We could have also use useKoaServer here to attach controllers to an existing koa instance.
   */
  const koaApp = createKoaServer({
    /**
     * We can add options about how routing-controllers should configure itself.
     * Here we specify what controllers should be registered in our express server.
     */
    controllers: [`${__dirname}/controller/*.ts`],
    middlewares: [`${__dirname}/middleware/*.ts`],
    routePrefix: '/api',
    cors: true,
    ...decorators,
  });

  /**
   * Start the koa app.
   */
  koaApp.listen(config.port);

  console.log(`Server is up and running at port ${config.port}`);

}).catch(error => console.log(error));
