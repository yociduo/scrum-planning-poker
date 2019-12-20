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

  @Column({ nullable: false })
  userId: number;

  @ManyToOne(() => User, user => user.scores)
  user: User;

  @Column({ nullable: false })
  storyId: number;

  @ManyToOne(() => Story, story => story.scores)
  story: Story;

  @IsHexadecimal()
  @Column('decimal', { nullable: true, precision: 4, scale: 1  })
  card?: number;

  @IsInt()
  @Column('smallint', { default: 0 })
  timer: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  displayCard?: string;

}
