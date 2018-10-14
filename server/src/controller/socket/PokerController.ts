import {
  ConnectedSocket,
  MessageBody,
  OnConnect,
  OnDisconnect,
  OnMessage,
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
  async join(@ConnectedSocket() socket: Socket, @MessageBody() roomId: number) {
    console.log(`User ${socket.user.id} join room ${roomId}`);
    await this.roomRepository.joinOrLeave(roomId, socket.user);
    const room = await this.roomRepository.getRoomDetail(roomId, socket.user);
    socket.emit('init', room);
    socket.join(formatRoomId(roomId), () => {
      const { id, currentStory } = room;
      socket.to(formatRoomId(roomId)).emit('action', { id, currentStory });
    });
  }

  @OnMessage('leave room')
  async leave(@ConnectedSocket() socket: Socket, @MessageBody() roomId: number) {
    console.log(`User ${socket.user.id} leave room ${roomId}`);
    await this.roomRepository.joinOrLeave(roomId, socket.user, true);
    const room = await this.roomRepository.getRoomDetail(roomId, socket.user);
    socket.leave(formatRoomId(roomId), () => {
      const { id, currentStory } = room;
      socket.to(formatRoomId(roomId)).emit('action', { id, currentStory });
    });
  }

}
