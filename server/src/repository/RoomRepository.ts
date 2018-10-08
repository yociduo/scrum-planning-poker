import { Repository, EntityRepository } from 'typeorm';
import { Room } from '../entity';

@EntityRepository(Room)
export class RoomRepository extends Repository<Room> {
}
