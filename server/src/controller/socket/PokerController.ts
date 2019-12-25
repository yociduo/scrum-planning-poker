import { getLogger } from 'log4js';
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
import { Room, Story } from '../../entity';
import { RoomRepository } from '../../repository';
import { Socket, formatRoomId } from '../../util';

const logger = getLogger('socket');

@SocketController()
export class PokerController {

  @InjectRepository(Room)
  private roomRepository: RoomRepository;

  @OnConnect()
  connection() {
    logger.info('client connected');
  }

  @OnDisconnect()
  disconnect() {
    logger.info('client disconnected');
  }

  @OnMessage('join room')
  async join(@ConnectedSocket() socket: Socket, @MessageBody() roomId: number) {
    logger.info(`User ${socket.user.id} join room ${roomId}`);
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
    logger.info(`User ${socket.user.id} leave room ${roomId}`);
    await this.roomRepository.joinOrLeave(roomId, socket.user, true);
    const room = await this.roomRepository.getRoomDetail(roomId, socket.user);
    socket.leave(formatRoomId(roomId), () => {
      const { id, currentStory } = room;
      socket.to(formatRoomId(roomId)).emit('action', { id, currentStory });
    });
  }

  @OnMessage('select card')
  async selectCard(@ConnectedSocket() socket: Socket, @SocketIO() io: Socket, @MessageBody() { id, card }: { id: number, card: number }) {
    logger.info(`User ${socket.user.id} selected card ${card}`);
    const room = await this.roomRepository.selectCard(id, socket.user, card);
    if (room) {
      const { currentScore, currentStory } = room;
      io.to(formatRoomId(id)).emit('action', { id, currentScore, currentStory });
    }
  }

  @OnMessage('calc method')
  async calcMethod(@ConnectedSocket() socket: Socket, @MessageBody() { id, calcMethod }: { id: number, calcMethod: number }) {
    logger.info(`User ${socket.user.id} changed calc method ${JSON.stringify(calcMethod)}`);
    const room = await this.roomRepository.calcMethod(id, calcMethod);
    if (room) {
      const { id, options, currentScore } = room;
      socket.emit('action', { id, options, currentScore });
    }
  }

  @OnMessage('current score')
  async changeCurrentScore(@ConnectedSocket() socket: Socket, @MessageBody() { id, currentScore }: { id: number, currentScore: number }) {
    logger.info(`User ${socket.user.id} change current score to ${currentScore}`);
    const room = await this.roomRepository.changeCurrentScore(id, currentScore);
    if (room) {
      const { id, currentStory, currentScore, options } = room;
      socket.emit('action', { id, currentStory, currentScore, options });
    }
  }

  @OnMessage('next story')
  async nextStory(@ConnectedSocket() socket: Socket, @SocketIO() io: Socket, @MessageBody() roomId: number) {
    logger.info(`User ${socket.user.id} next story for room ${roomId}`);
    const room = await this.roomRepository.nextStory(roomId);
    if (room) {
      const {
        id,
        currentStory,
        currentScore,
        selectedCard,
        stories,
        isCompleted,
        scoreSum,
        displayTimerSum,
        timerSum,
      } = room;
      io.to(formatRoomId(id)).emit('action', {
        id,
        currentStory,
        currentScore,
        selectedCard,
        stories,
        isCompleted,
        scoreSum,
        displayTimerSum,
        timerSum,
        loading: false,
      });
    }
  }

  @OnMessage('add story')
  async addStory(@ConnectedSocket() socket: Socket, @SocketIO() io: Socket, @MessageBody() { id, stories }: { id: number, stories: Story[] }) {
    logger.info(`User ${socket.user.id} add story ${stories} for room ${id}`);
    const room = await this.roomRepository.addStory(id, stories, socket.user);
    if (room) {
      const {
        id,
        currentStory,
        currentScore,
        selectedCard,
        stories,
        isCompleted,
        scoreSum,
        displayTimerSum,
        timerSum,
        storyCount,
      } = room;

      io.to(formatRoomId(id)).emit('action', {
        id,
        currentStory,
        currentScore,
        selectedCard,
        stories,
        isCompleted,
        scoreSum,
        displayTimerSum,
        timerSum,
        storyCount,
      });
    }
  }

}
