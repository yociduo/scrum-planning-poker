import {
  IsBoolean,
} from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Room } from './Room';
import { User } from './User';

@Entity({ name: 'UserRooms' })
export class UserRoom {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.visitedRooms)
  user: User;

  @ManyToOne(() => Room, room => room.users)
  room: Room;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @IsBoolean()
  @Column()
  isLeft: boolean;

  @IsBoolean()
  @Column()
  isHost: boolean;

}
