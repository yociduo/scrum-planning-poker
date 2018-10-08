import * as jwt from 'jsonwebtoken';
import { Service } from 'typedi';
import { Repository, EntityRepository } from 'typeorm';
import { User } from '../entity';
import { WxLogin } from '../model';

@Service()
@EntityRepository(User)
export class UserRepository extends Repository<User> {

  async wxLogin(data: WxLogin): Promise<string> {
    const user = await this.findOne(1);
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

}
