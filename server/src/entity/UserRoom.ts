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

  @Column({ nullable: false })
  userId: number;

  @ManyToOne(() => User, user => user.visitedRooms)
  user: User;

  @Column({ nullable: false })
  roomId: number;

  @ManyToOne(() => Room, room => room.userRooms)
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
