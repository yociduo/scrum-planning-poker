import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { Room } from '../entity';

@Service()
export class RoomRepository extends Repository<Room> {
}
