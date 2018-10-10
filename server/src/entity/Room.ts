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

@Entity({ name: 'Rooms' })
export class Room {

  @PrimaryGeneratedColumn()
  id: number;

  @Length(255)
  @Column({ default: '' })
  name: string;

  @OneToMany(() => UserRoom, userRoom => userRoom.user)
  users: UserRoom[];

  @OneToMany(() => Story, story => story.room)
  stories: Story[];

  @ManyToOne(() => User, user => user.createdRooms, { nullable: false })
  creator: User;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, user => user.updatedRooms, { nullable: false })
  updater: User;

  @UpdateDateColumn()
  updatedAt: Date;

  @IsBoolean()
  @Column({ default: false })
  isDeleted: boolean;

  @Column('simple-json', { nullable: true })
  options: any;

}
