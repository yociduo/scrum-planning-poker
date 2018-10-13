require('dotenv').config();

export const config = {
  host: process.env.HOST,
  apiPort: Number(process.env.API_PORT),
  socketPort: Number(process.env.SOCKET_PORT),
  jwtSecret: process.env.JWT_SECRET,
  wxSecret: process.env.WX_SECRET,
  wxAppid: process.env.WX_APPID,
};
