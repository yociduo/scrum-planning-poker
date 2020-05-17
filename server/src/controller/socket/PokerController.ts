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
import { PokerMessageBody } from '../../model';
import { Socket, Poker } from '../../util';

const logger = getLogger('poker');

@SocketController()
export class PokerController {

  @OnConnect()
  connection(@ConnectedSocket() socket: Socket) {
    logger.info(`User ${socket.user.id} connected`);
  }

  @OnDisconnect()
  async disconnect(@ConnectedSocket() socket: Socket) {
    try {
      logger.info(`User ${socket.user.id} disconnected`);
      await Poker.disconnect(socket.user);
    } catch (error) {
      logger.error(`User ${socket.user.id} disconnected`, error);
    }
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
      logger.error(`User ${socket.user.id} join room ${id}`, error);
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
      logger.error(`User ${socket.user.id} leave room ${id}`, error);
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
      logger.error(`User ${socket.user.id} selected card ${card}`, error);
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
      logger.error(`User ${socket.user.id} changed calc method ${calcMethod}`, error);
    }
  }

  @OnMessage('[Poker] current score')
  async changeCurrentScore(@ConnectedSocket() socket: Socket, @SocketIO() io: Socket, @MessageBody() { id, currentScore }: PokerMessageBody) {
    try {
      logger.info(`User ${socket.user.id} change current score to ${currentScore}`);
      const poker = await Poker.getPoker(id);
      await poker.changeCurrentScore(currentScore);
      const { roomId, room: { options } } = poker;
      io.to(roomId).emit('[Poker] action', { id, currentScore, options });
    } catch (error) {
      logger.error(`User ${socket.user.id} change current score to ${currentScore}`, error);
    }
  }

  @OnMessage('[Poker] next story')
  async nextStory(@ConnectedSocket() socket: Socket, @SocketIO() io: Socket, @MessageBody() { id }: PokerMessageBody) {
    try {
      logger.info(`User ${socket.user.id} next story for room ${id}`);
      const poker = await Poker.getPoker(id);
      await poker.nextStory();
      const { roomId, currentStory, currentScore, stories } = poker;
      io.to(roomId).emit('[Poker] action', { id, stories, currentScore, currentStory, selectedCard: null, loading: false });
    } catch (error) {
      logger.error(`User ${socket.user.id} next story for room ${id}`, error);
    }
  }

  @OnMessage('[Poker] add story')
  async addStory(@ConnectedSocket() socket: Socket, @SocketIO() io: Socket, @MessageBody() { id, storyNames }: PokerMessageBody) {
    try {
      logger.info(`User ${socket.user.id} add story ${storyNames.join()} for room ${id}`);
      const poker = await Poker.getPoker(id);
      await poker.addStories(storyNames, socket.user);
      const { roomId, currentStory, currentScore } = poker;
      io.to(roomId).emit('[Poker] action', { id, currentScore, currentStory, selectedCard: null, loading: false });
    } catch (error) {
      logger.info(`User ${socket.user.id} add story ${storyNames.join()} for room ${id}`, error);
    }
  }

  @OnMessage('[Poker] show hide score')
  async showHideScore(@ConnectedSocket() socket: Socket, @SocketIO() io: Socket, @MessageBody() { id, isNoymous }: PokerMessageBody) {
    try {
      logger.info(`User ${socket.user.id} ${isNoymous ? 'show' : 'hide' } score for room ${id}`);
      const poker = await Poker.getPoker(id);
      await poker.toggleShowHideScore(isNoymous);
      const { roomId, room: { options } } = poker;
      io.to(roomId).emit('[Poker] action', { id, options });
    } catch (error) {
      logger.info(`User ${socket.user.id} ${isNoymous ? 'show' : 'hide' } score for room ${id}`, error);
    }
  }

}
