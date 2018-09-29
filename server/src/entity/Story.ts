import {
  IsBoolean,
  IsHexadecimal,
  IsInt,
  Length,
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
import { Room } from './Room';
import { Score } from './Score';
import { User } from './User';

@Entity({ name: 'Stories' })
export class Story {

  @PrimaryGeneratedColumn()
  id: number;

  @Length(1023)
  @Column()
  name: string;

  @Column('text')
  description: string;

  @ManyToOne(() => Room, room => room.stories)
  room: Room;

  @OneToMany(() => Score, score => score.user)
  scores: Score[];

  @IsHexadecimal()
  @Column('decimal', { precision: 1 })
  score: number;

  @IsInt()
  @Column('smallint')
  timer: number;

  @IsInt()
  @Column('smallint', { nullable: true })
  meanType: number;

  @ManyToOne(() => User, user => user.createdStories)
  creator: User;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, user => user.updatedStories)
  updater: User;

  @UpdateDateColumn()
  updatedAt: Date;

  @IsBoolean()
  @Column()
  isDeleted: boolean;

  @IsBoolean()
  @Column()
  isCompleted: boolean;

}
