import {
  ConnectedSocket,
  MessageBody,
  OnConnect,
  OnDisconnect,
  OnMessage,
  SocketIO,
  SocketController,
} from 'socket-controllers';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { Room } from '../../entity';
import { RoomRepository } from '../../repository';
import { Socket, formatRoomId } from '../../socket';

@SocketController()
export class PokerController {

  @InjectRepository(Room)
  private roomRepository: RoomRepository;

  @OnConnect()
  connection() {
    console.log('client connected');
  }

  @OnDisconnect()
  disconnect() {
    console.log('client disconnected');
  }

  @OnMessage('join room')
  async join(@ConnectedSocket() socket: Socket, @SocketIO() io: Socket, @MessageBody() roomId: number) {
    console.log(`User ${socket.user.id} join room ${roomId}`);
    await this.roomRepository.joinOrLeave(roomId, socket.user);
    socket.emit('init', await this.roomRepository.getRoomDetail(roomId, socket.user));
    socket.join(formatRoomId(roomId), () => {
      socket.to(formatRoomId(roomId)).emit('test');
    });
  }

  @OnMessage('leave room')
  leave(@ConnectedSocket() socket: Socket, @SocketIO() io: Socket, @MessageBody() roomId: number) {
    console.log(`User ${socket.user.id} leave room ${roomId}`);
    this.roomRepository.joinOrLeave(roomId, socket.user, true);
    socket.leave(formatRoomId(roomId), this.emitRoomInfo(io, roomId));
  }

  private emitRoomInfo = (io: Socket, roomId: number) => (err?: any) => {
    if (err) {
      console.error(err);
    } else {
      io.to(formatRoomId(roomId)).emit('room info');
    }
  }

}
