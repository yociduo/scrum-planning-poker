import * as dotenv from 'dotenv';
import { configure, Configuration } from 'log4js';

// Load environment variables from .env file, where API keys and passwords are configured
dotenv.config({ path: '.env' });

export interface IConfig {
  prod: boolean;
  host: string;
  routePrefix: string;
  apiPort: number;
  socketPort: number;
  jwtSecret: string;
  wxSecret: string;
  wxAppid: string;
  databaseHost: string;
  databasePort: number;
  databaseUsername: string;
  databasePassword: string;
  databaseScheme: string;
}

export const config: IConfig = {
  prod: process.env.NODE_ENV === 'production',
  host: process.env.HOST,
  routePrefix: process.env.ROUTE_PREFIX,
  apiPort: Number(process.env.API_PORT || 3000),
  socketPort: Number(process.env.SOCKET_PORT || 3001),
  jwtSecret: process.env.JWT_SECRET,
  wxSecret: process.env.WX_SECRET,
  wxAppid: process.env.WX_APPID,
  databaseHost: process.env.DATABASE_HOST,
  databasePort: Number(process.env.DATABASE_PORT || 3306),
  databaseUsername: process.env.DATABASE_USERNAME,
  databasePassword: process.env.DATABASE_PASSWORD,
  databaseScheme: process.env.DATABASE_SCHEME,
};

const log4jsConfig: Configuration = {
  appenders: {
    app: {
      type: 'dateFile',
      filename: 'logs/app.log',
      pattern: '.yyyy-MM-dd',
      keepFileExt: true,
    },
    errorFile: {
      type: 'file',
      filename: 'logs/errors.log',
      maxLogSize: 10485760,
      keepFileExt: true,
    },
    errors: {
      type: 'logLevelFilter',
      level: 'ERROR',
      appender: 'errorFile',
    },
    stdout: {
      type: 'stdout',
    },
    stderr: {
      type: 'stderr',
    },
  },
  categories: { default: { appenders: ['app', 'errors'], level: 'info' } },
};

if (!config.prod) {
  log4jsConfig.categories.default.appenders.push('stdout');
}

// Initialise log4js first, so we don't miss any log messages
configure(log4jsConfig);
