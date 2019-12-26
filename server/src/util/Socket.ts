import { Socket as OriginSocket } from 'socket.io';
import { User } from '../entity';

export type Socket = OriginSocket & {
  user: User,
};
