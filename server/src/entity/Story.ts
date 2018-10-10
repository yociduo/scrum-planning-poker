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
  @Column({ default: '' })
  name: string;

  @Column('text', { nullable: true })
  description?: string;

  @ManyToOne(() => Room, room => room.stories, { nullable: false })
  room: Room;

  @OneToMany(() => Score, score => score.user)
  scores: Score[];

  @IsHexadecimal()
  @Column('decimal', { nullable: true, precision: 1 })
  score?: number;

  @IsInt()
  @Column('smallint', { default: 0 })
  timer: number;

  @IsInt()
  @Column('smallint', { nullable: true })
  meanType?: number;

  @ManyToOne(() => User, user => user.createdStories, { nullable: false })
  creator: User;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, user => user.updatedStories, { nullable: false })
  updater: User;

  @UpdateDateColumn()
  updatedAt: Date;

  @IsBoolean()
  @Column({ default: false })
  isDeleted: boolean;

  // @IsBoolean()
  // @Column({ default: false })
  isCompleted: boolean;

}
