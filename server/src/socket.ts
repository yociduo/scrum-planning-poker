import { Socket as OriginSocket } from 'socket.io';
import { User } from './entity';

export type Socket = OriginSocket & {
  user: User,
};

export function formatRoomId(roomId: number): string {
  return `Room ${roomId}`;
}
