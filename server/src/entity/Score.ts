import {
  IsHexadecimal,
  IsInt,
} from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Story } from './Story';
import { User } from './User';

@Entity({ name: 'Scores' })
export class Score {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.scores, { nullable: false })
  user: User;

  @ManyToOne(() => Story, story => story.scores, { nullable: false })
  story: Story;

  @IsHexadecimal()
  @Column('decimal', { default: 0, precision: 1 })
  score: number;

  @IsInt()
  @Column('smallint', { default: 0 })
  timer: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

}
