import {
  Length,
  IsBoolean,
} from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Story } from './Story';
import { User } from './User';
import { UserRoom } from './UserRoom';
import { RoomOptions } from '../model';

@Entity()
export class Room {

  @PrimaryGeneratedColumn()
  id: number;

  @Length(255)
  @Column({ default: '' })
  name: string;

  @OneToMany(() => UserRoom, userRoom => userRoom.room)
  userRooms: UserRoom[];

  @OneToMany(() => Story, story => story.room)
  stories: Story[];

  @Column('simple-json', { nullable: true })
  options?: RoomOptions;

  @Column({ nullable: false, select: false })
  creatorId: number;

  @ManyToOne(() => User, user => user.createdRooms)
  creator: User;

  @CreateDateColumn({ select: false })
  createdAt: Date;

  @Column({ nullable: false, select: false })
  updaterId: number;

  @ManyToOne(() => User, user => user.updatedRooms)
  updater: User;

  @UpdateDateColumn({ select: false })
  updatedAt: Date;

  @IsBoolean()
  @Column({ default: false, select: false })
  isDeleted: boolean;

  isHost?: boolean;

  isCreator?: boolean;

  isCompleted?: boolean;

  storyCount?: number;

  scoreSum?: number;

  timerSum?: number;

  displayTimerSum?: string;

}
