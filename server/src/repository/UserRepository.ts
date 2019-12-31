import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import { Service } from 'typedi';
import { Repository, EntityRepository } from 'typeorm';
import { config } from '../config';
import { User } from '../entity';
import { WxLogin } from '../model';
import { decryptData } from '../util';

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

    const { openid: openId, session_key: sessionKey, errcode, errmsg } = response.data;
    if (errcode) {
      throw new Error(errmsg);
    }

    let user = await this.findOne({ where: { openId } });
    if (!user) {
      user = new User();
    }

    if (data.encryptedData && data.iv) {
      const userInfo = decryptData(data.encryptedData, data.iv, sessionKey);
      user.nickName = userInfo.nickName;
      user.avatarUrl = userInfo.avatarUrl;
      user.gender = userInfo.gender;
      user.language = userInfo.language;
      user.city = userInfo.city;
      user.country = userInfo.country;
      user.province = userInfo.province;
      user.language = userInfo.language;
    }
    user.openId = openId;
    user.sessionKey = sessionKey;
    await this.save(user);
    const token = this.sign(user);
    return Promise.resolve(token);
  }

  async login(token: string): Promise<User> {
    const id = this.verify(token);
    return await this.findOne(id);
  }

  verify(token: string): number {
    try {
      return Number(jwt.verify(token.slice(7), config.jwtSecret));
    } catch {
      return null;
    }
  }

  sign(user: User): string {
    return jwt.sign(user.id.toString(), config.jwtSecret);
  }

}
