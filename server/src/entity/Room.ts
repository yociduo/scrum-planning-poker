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

@Entity({ name: 'Rooms' })
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

  @Column({ nullable: false })
  creatorId: number;

  @ManyToOne(() => User, user => user.createdRooms)
  creator: User;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: false })
  updaterId: number;

  @ManyToOne(() => User, user => user.updatedRooms)
  updater: User;

  @UpdateDateColumn()
  updatedAt: Date;

  @IsBoolean()
  @Column({ default: false })
  isDeleted: boolean;

  @Column('simple-json', { nullable: true })
  options?: RoomOptions;

  currentStory?: Story;

  currentScore?: number;

  selectedCard?: number;

  loading?: boolean;

  isHost?: boolean;

  isCreator?: boolean;

  isCompleted?: boolean;

  storyCount?: number;

  scoreSum?: number;

  timerSum?: number;

  displayTimerSum?: string;

}
