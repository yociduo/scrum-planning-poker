import 'reflect-metadata';
import { createKoaServer, useContainer as routingUseContainer } from 'routing-controllers';
import { createSocketServer, useContainer as socketUseContainer } from 'socket-controllers';
import { Container } from 'typedi';
import { useContainer as ormUseContainer, createConnection } from 'typeorm';
import { config } from './config';
import { decorators } from './decorator';

/**
 * Setup routing-controllers typeorm and socket-controllers to use typedi container.
 */
routingUseContainer(Container);
ormUseContainer(Container);
socketUseContainer(Container);

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
    controllers: [`${__dirname}/controller/api/*.ts`],
    middlewares: [`${__dirname}/middleware/*.ts`],
    routePrefix: '/api',
    cors: true,
    ...decorators,
  });

  createSocketServer(config.socketPort, {
    controllers: [`${__dirname}/controller/socket/*.ts`],
  });

  /**
   * Start the koa app.
   */
  koaApp.listen(config.apiPort);

  console.log(`Server is up and running at port ${config.apiPort}`);

}).catch(error => console.log(error));
