import { getLogger } from 'log4js';
import {
  ConnectedSocket,
  MessageBody,
  OnConnect,
  OnDisconnect,
  OnMessage,
  SocketIO,
  SocketController,
  EmitOnSuccess,
} from 'socket-controllers';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { Room, Story } from '../../entity';
import { PokerMessageBody } from '../../model';
import { RoomRepository } from '../../repository';
import { formatRoomId, Socket, Poker } from '../../util';

const logger = getLogger('poker');

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

  @OnMessage('[Poker] join room')
  @EmitOnSuccess('[Poker] init')
  async join(@ConnectedSocket() socket: Socket, @MessageBody() { id }: PokerMessageBody) {
    try {
      logger.info(`User ${socket.user.id} join room ${id}`);
      const poker = await Poker.getPoker(id);
      await poker.join(socket.user);
      const { roomId, currentStory } = poker;
      socket.join(roomId, () => socket.to(roomId).emit('[Poker] action', { id, currentStory }));
      return poker.getRoom(socket.user);
    } catch (error) {
      logger.error('[Poker] join room', error);
    }
  }

  @OnMessage('[Poker] leave room')
  async leave(@ConnectedSocket() socket: Socket, @MessageBody() { id }: PokerMessageBody) {
    try {
      logger.info(`User ${socket.user.id} leave room ${id}`);
      const poker = await Poker.getPoker(id);
      await poker.leave(socket.user);
      const { roomId, currentStory } = poker;
      socket.leave(roomId, () => socket.to(roomId).emit('[Poker] action', { id, currentStory }));
    } catch (error) {
      logger.error('[Poker] leave room', error);
    }
  }

  @OnMessage('[Poker] select card')
  async selectCard(@ConnectedSocket() socket: Socket, @SocketIO() io: Socket, @MessageBody() { id, card }: PokerMessageBody) {
    try {
      logger.info(`User ${socket.user.id} selected card ${card}`);
      const poker = await Poker.getPoker(id);
      await poker.selectCard(socket.user, card);
      const { roomId, currentScore, currentStory } = poker;
      io.to(roomId).emit('[Poker] action', { id, currentScore, currentStory });
    } catch (error) {
      logger.error('[Poker] select card', error);
    }
  }

  @OnMessage('[Poker] calc method')
  async calcMethod(@ConnectedSocket() socket: Socket, @SocketIO() io: Socket, @MessageBody() { id, calcMethod }: PokerMessageBody) {
    try {
      logger.info(`User ${socket.user.id} changed calc method ${calcMethod}`);
      const poker = await Poker.getPoker(id);
      await poker.calcMethod(calcMethod);
      const { roomId, currentScore, room: { options } } = poker;
      io.to(roomId).emit('[Poker] action', { id, currentScore, options });
    } catch (error) {
      logger.error('[Poker] calc method', error);
    }
  }

  @OnMessage('[Poker] current score')
  async changeCurrentScore(@ConnectedSocket() socket: Socket, @SocketIO() io: Socket, @MessageBody() { id, currentScore }: PokerMessageBody) {
    try {
      logger.info(`User ${socket.user.id} change current score to ${currentScore}`);
      const poker = await Poker.getPoker(id);
      await poker.changeCurrentScore(currentScore);
      const { roomId, currentStory, room: { options } } = poker;
      io.to(roomId).emit('[Poker] action', { id, currentScore, currentStory, options });
    } catch (error) {
      logger.error('[Poker] current score', error);
    }
  }

  @OnMessage('[Poker] next story')
  async nextStory(@ConnectedSocket() socket: Socket, @SocketIO() io: Socket, @MessageBody() { id }: PokerMessageBody) {
    try {
      logger.info(`User ${socket.user.id} next story for room ${id}`);
      const poker = await Poker.getPoker(id);
      await poker.nextStory();
      const { roomId, currentStory, currentScore, room: { options, stories } } = poker;
      io.to(roomId).emit('[Poker] action', { id, stories, currentScore, currentStory, options, selectCard: null, loading: false });
    } catch (error) {
      logger.error('[Poker] next story', error);
    }
  }

  @OnMessage('[Poker] add story')
  async addStory(@ConnectedSocket() socket: Socket, @SocketIO() io: Socket, @MessageBody() { id, storyNames }: PokerMessageBody) {
    try {
      logger.info(`User ${socket.user.id} add story ${storyNames.join()} for room ${id}`);
      const poker = await Poker.getPoker(id);
      await poker.addStories(storyNames, socket.user);
      const { roomId, currentStory, currentScore, room: { options, stories } } = poker;
      io.to(roomId).emit('[Poker] action', { id, stories, currentScore, currentStory, options, selectCard: null, loading: false });
    } catch (error) {
      logger.error('[Poker] add story', error);
    }
  }

  @OnMessage('join room')
  async _join(@ConnectedSocket() socket: Socket, @MessageBody() id: number) {
    logger.info(`User ${socket.user.id} join room ${id}`);
    await this.roomRepository.joinOrLeave(id, socket.user);
    const room = await this.roomRepository.getRoomDetail(id, socket.user);
    socket.emit('init', room);
    socket.join(formatRoomId(id), () => {
      const { id, currentStory } = room;
      socket.to(formatRoomId(id)).emit('action', { id, currentStory });
    });
  }

  @OnMessage('leave room')
  async _leave(@ConnectedSocket() socket: Socket, @MessageBody() id: number) {
    logger.info(`User ${socket.user.id} leave room ${id}`);
    await this.roomRepository.joinOrLeave(id, socket.user, true);
    const room = await this.roomRepository.getRoomDetail(id, socket.user);
    socket.leave(formatRoomId(id), () => {
      const { id, currentStory } = room;
      socket.to(formatRoomId(id)).emit('action', { id, currentStory });
    });
  }

  @OnMessage('select card')
  async _selectCard(@ConnectedSocket() socket: Socket, @SocketIO() io: Socket, @MessageBody() { id, card }: { id: number, card: number }) {
    logger.info(`User ${socket.user.id} selected card ${card}`);
    const room = await this.roomRepository.selectCard(id, socket.user, card);
    if (room) {
      const { currentScore, currentStory } = room;
      io.to(formatRoomId(id)).emit('action', { id, currentScore, currentStory });
    }
  }

  @OnMessage('calc method')
  async _calcMethod(@ConnectedSocket() socket: Socket, @MessageBody() { id, calcMethod }: { id: number, calcMethod: number }) {
    logger.info(`User ${socket.user.id} changed calc method ${JSON.stringify(calcMethod)}`);
    const room = await this.roomRepository.calcMethod(id, calcMethod);
    if (room) {
      const { id, options, currentScore } = room;
      socket.emit('action', { id, options, currentScore });
    }
  }

  @OnMessage('current score')
  async _changeCurrentScore(@ConnectedSocket() socket: Socket, @MessageBody() { id, currentScore }: { id: number, currentScore: number }) {
    logger.info(`User ${socket.user.id} change current score to ${currentScore}`);
    const room = await this.roomRepository.changeCurrentScore(id, currentScore);
    if (room) {
      const { id, currentStory, currentScore, options } = room;
      socket.emit('action', { id, currentStory, currentScore, options });
    }
  }

  @OnMessage('next story')
  async _nextStory(@ConnectedSocket() socket: Socket, @SocketIO() io: Socket, @MessageBody() id: number) {
    logger.info(`User ${socket.user.id} next story for room ${id}`);
    const room = await this.roomRepository.nextStory(id);
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
  async _addStory(@ConnectedSocket() socket: Socket, @SocketIO() io: Socket, @MessageBody() { id, stories }: { id: number, stories: Story[] }) {
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
