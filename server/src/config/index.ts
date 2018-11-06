import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

export interface IConfig {
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
