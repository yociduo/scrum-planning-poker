import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { User } from '../entity';

@Service()
export class UserRepository extends Repository<User> {
}
