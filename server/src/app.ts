import 'reflect-metadata';
import { getLogger } from 'log4js';
import { createKoaServer, useContainer as routingUseContainer } from 'routing-controllers';
import { createSocketServer, useContainer as socketUseContainer } from 'socket-controllers';
import { Container } from 'typedi';
import { useContainer as ormUseContainer, createConnection, getConnectionOptions } from 'typeorm';
import { config } from './config';
import { decorators } from './decorator';
import './middleware/socket/AuthenitificationMiddleware';

const logger = getLogger('startup');

/**
 * Setup routing-controllers typeorm and socket-controllers to use typedi container.
 */
routingUseContainer(Container);
ormUseContainer(Container);
socketUseContainer(Container);

async function createServer() {
  try {
    // read connection options from ormconfig file (or ENV variables)
    const connectionOptions = await getConnectionOptions();

    // do something with connectionOptions,
    Object.assign(connectionOptions, {
      entities: [
        `${__dirname}/entity/**/*.js`,
        `${__dirname}/entity/**/*.ts`,
      ],
      migrations: [
        `${__dirname}/migration/**/*.js`,
        `${__dirname}/migration/**/*.ts`,
      ],
      subscribers: [
        `${__dirname}/subscriber/**/*.js`,
        `${__dirname}/subscriber/**/*.ts`,
      ],
      cli: {
        entitiesDir: 'src/entity',
        migrationsDir: 'src/migration',
        subscribersDir: 'src/subscriber',
      },
    });
    if (connectionOptions.type === 'mysql') {
      Object.assign(connectionOptions, { bigNumberStrings: true });
    }

    // create a connection using modified connection options
    await createConnection(connectionOptions);
    logger.info('TypeORM connection success');

    /**
     * We create a new koa server instance.
     * We could have also use useKoaServer here to attach controllers to an existing koa instance.
     */
    const koaApp = createKoaServer({
      /**
       * We can add options about how routing-controllers should configure itself.
       * Here we specify what controllers should be registered in our express server.
       */
      controllers: [
        `${__dirname}/controller/api/*.js`,
        `${__dirname}/controller/api/*.ts`,
      ],
      middlewares: [
        `${__dirname}/middleware/api/*.js`,
        `${__dirname}/middleware/api/*.ts`,
      ],
      routePrefix: config.routePrefix,
      cors: true,
      ...decorators,
    });

    createSocketServer(config.socketPort, {
      controllers: [
        `${__dirname}/controller/socket/*.js`,
        `${__dirname}/controller/socket/*.ts`,
      ],
    });

    /**
     * Start the koa app.
     */
    koaApp.listen(config.apiPort);

    logger.info(`Server is up and running at port ${config.apiPort}`);
  } catch (error) {
    logger.error('TypeORM connection error: ', error);
  }
}

createServer();
