import {
  Length,
  IsInt,
  IsBoolean,
} from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Room } from './Room';
import { Score } from './Score';
import { Story } from './Story';
import { UserRoom } from './UserRoom';

@Entity({ name: 'Users' })
export class User {

  @PrimaryGeneratedColumn()
  id: number;

  @Length(255)
  @Column({ default: '' })
  nickName: string;

  @Length(255)
  @Column({ default: '' })
  avatarUrl: string;

  @IsInt()
  @Column('smallint', { nullable: true, select: false })
  gender?: number;

  @Length(255)
  @Column({ default: '', select: false })
  language: string;

  @Length(255)
  @Column({ default: '', select: false })
  city: string;

  @Length(255)
  @Column({ default: '', select: false })
  country: string;

  @Length(255)
  @Column({ default: '', select: false })
  province: string;

  @Length(255)
  @Column({ default: '', select: false })
  openId: string;

  @Length(255)
  @Column({ default: '', select: false })
  sessionKey: string;

  @OneToMany(() => Score, score => score.user)
  scores: Score[];

  @OneToMany(() => Room, room => room.creator)
  createdRooms: Room[];

  @OneToMany(() => Room, room => room.updater)
  updatedRooms: Room[];

  @OneToMany(() => UserRoom, userRoom => userRoom.user)
  visitedRooms: UserRoom[];

  @OneToMany(() => Story, room => room.creator)
  createdStories: Story[];

  @OneToMany(() => Story, room => room.updater)
  updatedStories: Story[];

  @CreateDateColumn({ select: false })
  createdAt: Date;

  @UpdateDateColumn({ select: false })
  updatedAt: Date;

  @IsBoolean()
  @Column({ default: false, select: false })
  isDeleted: boolean;

}
