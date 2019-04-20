import 'reflect-metadata';
import { getLogger } from 'log4js';
import { createKoaServer, useContainer as routingUseContainer } from 'routing-controllers';
import { createSocketServer, useContainer as socketUseContainer } from 'socket-controllers';
import { Container } from 'typedi';
import { useContainer as ormUseContainer, createConnection } from 'typeorm';
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

createConnection({
  type: 'mysql',
  host: config.databaseHost,
  port: config.databasePort,
  username: config.databaseUsername,
  password: config.databasePassword,
  database: config.databaseScheme,
  synchronize: true,
  logging: false,
  bigNumberStrings: false,
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
}).then(async () => {
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

}).catch(error => logger.error('TypeORM connection error: ', error));
