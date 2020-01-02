import * as jwt from 'jsonwebtoken';
import { cipher, util } from 'node-forge';
import { config } from '../config';
import { User } from '../entity';

export function decryptData(encryptedData: string, iv: string, sessionKey: string) {
  // base64 decode
  const encryptedDataNew = Buffer.from(encryptedData, 'base64');
  const sessionKeyNew = Buffer.from(sessionKey, 'base64');
  const ivNew = Buffer.from(iv, 'base64');

  let decoded;
  try {

    // 解密，使用的算法是aes-128-cbc
    const decipher = cipher.createDecipher('AES-CBC', new util.ByteStringBuffer(sessionKeyNew));
    decipher.start({ iv: new util.ByteStringBuffer(ivNew) });
    decipher.update(new util.ByteStringBuffer(encryptedDataNew));
    decipher.finish();
    decoded = JSON.parse(decipher.output.toString());
    // decoded是解密后的用户信息
  } catch (err) {
    throw new Error('Illegal Buffer');
  }

  // 解密后的用户数据中会有一个watermark属性，这个属性中包含这个小程序的appid和时间戳，下面是校验appid
  if (decoded.watermark.appid !== config.wxAppid) {
    throw new Error('Illegal Buffer');
  }

  // 返回解密后的用户数据
  return decoded;
}

export function sign({ id, nickName }: User): string {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: nickName ? null : '1d',
  });
}

export function verify(token: string) {
  const data = jwt.verify(token.startsWith('Bearer ') ? token.slice(7) : token, config.jwtSecret);
  if (typeof data === 'string') {
    return Number(data);
  }
  return data['id'];
}
