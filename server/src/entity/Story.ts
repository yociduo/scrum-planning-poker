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

  @Column({ nullable: false })
  roomId: number;

  @ManyToOne(() => Room, room => room.stories)
  room: Room;

  @OneToMany(() => Score, score => score.story)
  scores: Score[];

  @IsHexadecimal()
  @Column('decimal', { nullable: true, precision: 4, scale: 1  })
  score?: number;

  @IsInt()
  @Column('smallint', { default: 0 })
  timer: number;

  @IsInt()
  @Column('smallint', { nullable: true })
  meanType?: number;

  @Column({ nullable: false })
  creatorId: number;

  @ManyToOne(() => User, user => user.createdStories)
  creator: User;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: false })
  updaterId: number;

  @ManyToOne(() => User, user => user.updatedStories)
  updater: User;

  @UpdateDateColumn()
  updatedAt: Date;

  @IsBoolean()
  @Column({ default: false })
  isDeleted: boolean;

  @IsBoolean()
  @Column({ default: false })
  isCompleted: boolean;

  displayTimer?: string;

}
