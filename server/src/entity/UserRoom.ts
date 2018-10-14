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

  @ManyToOne(() => User, user => user.visitedRooms, { nullable: false })
  user: User;

  @ManyToOne(() => Room, room => room.userRooms, { nullable: false })
  room: Room;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @IsBoolean()
  @Column({ default: false })
  isLeft: boolean;

  @IsBoolean()
  @Column({ default: false })
  isHost: boolean;

}
