require('dotenv').config();

export const config = {
  host: process.env.HOST,
  port: process.env.PORT,
  jwtSecret: process.env.JWT_SECRET,
  wxSecret: process.env.WX_SECRET,
  wxAppid: process.env.WX_APPID,
};
