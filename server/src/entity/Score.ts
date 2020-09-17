import {
  IsHexadecimal,
  IsInt,
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
import { Story } from './Story';
import { User } from './User';

@Entity()
export class Score {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false, select: false })
  userId: number;

  @ManyToOne(() => User, user => user.scores)
  user: User;

  @Column({ nullable: false, select: false })
  storyId: number;

  @ManyToOne(() => Story, story => story.scores)
  story: Story;

  @IsHexadecimal()
  @Column('decimal', { nullable: true, precision: 4, scale: 1  })
  card?: number;

  @IsInt()
  @Column('int', { default: 0 })
  timer: number;

  @CreateDateColumn({ select: false })
  createdAt: Date;

  @UpdateDateColumn({ select: false })
  updatedAt: Date;

  @IsBoolean()
  @Column({ default: false, select: false })
  isDeleted: boolean;

  displayCard?: string;

}
