import axios from 'axios';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { Service } from 'typedi';
import { Repository, EntityRepository } from 'typeorm';
import { config } from '../config';
import { User } from '../entity';
import { WxLogin } from '../model';

@Service()
@EntityRepository(User)
export class UserRepository extends Repository<User> {

  async wxLogin(data: WxLogin): Promise<string> {
    const response = await axios({
      url: 'https://api.weixin.qq.com/sns/jscode2session',
      method: 'GET',
      params: {
        appid: config.wxAppid,
        secret: config.wxSecret,
        js_code: data.code,
        grant_type: 'authorization_code',
      },
    });

    const { openid: openId, session_key: sessionKey } = response.data;
    let user = await this.findOne({ where: { openId } });

    if (!user) {
      const userInfo = this.decrypt(data.encryptedData, data.iv, sessionKey);
      user = new User();
      user.nickName = userInfo.nickName;
      user.gender = userInfo.gender;
      user.language = userInfo.language;
      user.city = userInfo.city;
      user.country = userInfo.country;
      user.province = userInfo.province;
      user.openId = userInfo.openId;
      user.language = userInfo.language;
      user.sessionKey = sessionKey;
      user = await this.save(user);
    }

    const token = this.sign(user);
    return Promise.resolve(token);
  }

  async login(token: string): Promise<User> {
    const id = this.verify(token);
    return await this.findOne(id);
  }

  verify(token: string): number {
    try {
      return Number(jwt.verify(token.slice(7), 'secret'));
    } catch {
      return null;
    }
  }

  sign(user: User): string {
    return jwt.sign(user.id.toString(), 'secret');
  }

  decrypt(encryptedData: string, iv: string, sessionKey: string) {
    // base64 decode
    const encryptedDataNew = Buffer.from(encryptedData, 'base64');
    const sessionKeyNew = Buffer.from(sessionKey, 'base64');
    const ivNew = Buffer.from(iv, 'base64');

    let decoded;
    try {
      // 解密，使用的算法是aes-128-cbc
      const decipher = crypto.createDecipheriv('aes-128-cbc', sessionKeyNew, ivNew);
      // 设置自动 padding 为 true，删除填充补位
      decipher.setAutoPadding(true);
      decoded = decipher.update(encryptedDataNew, 'binary', 'utf8');
      decoded += decipher.final('utf8');
      decoded = JSON.parse(decoded);
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

}
