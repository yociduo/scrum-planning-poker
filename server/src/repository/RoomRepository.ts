import { Service } from 'typedi';
import { Repository, EntityRepository } from 'typeorm';
import { Room } from '../entity';

@Service()
@EntityRepository(Room)
export class RoomRepository extends Repository<Room> {
}
