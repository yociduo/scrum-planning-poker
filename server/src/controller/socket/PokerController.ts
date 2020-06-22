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
    return this.base(`User ${socket.user.id} connected`, async () => { });
  }

  @OnDisconnect()
  async disconnect(@ConnectedSocket() socket: Socket) {
    return this.base(`User ${socket.user.id} disconnected`, async () => await Poker.disconnect(socket.user));
  }

  @OnMessage('[Poker] join room')
  @EmitOnSuccess('[Poker] init')
  async join(@ConnectedSocket() socket: Socket, @MessageBody() { id }: PokerMessageBody) {
    return this.base(`User ${socket.user.id} join room ${id}`, async () => {
      const poker = await Poker.getPoker(id);
      await poker.join(socket.user);
      const { roomId, currentStory } = poker;
      socket.join(roomId, () => socket.to(roomId).emit('[Poker] action', { id, currentStory }));
      return poker.getRoom(socket.user);
    });
  }

  @OnMessage('[Poker] leave room')
  async leave(@ConnectedSocket() socket: Socket, @MessageBody() { id }: PokerMessageBody) {
    return this.base(`User ${socket.user.id} leave room ${id}`, async () => {
      const poker = await Poker.getPoker(id);
      await poker.leave(socket.user);
      const { roomId, currentStory } = poker;
      socket.leave(roomId, () => socket.to(roomId).emit('[Poker] action', { id, currentStory }));
    });
  }

  @OnMessage('[Poker] select card')
  async selectCard(@ConnectedSocket() socket: Socket, @SocketIO() io: Socket, @MessageBody() { id, card }: PokerMessageBody) {
    return this.base(`User ${socket.user.id} selected card ${card}`, async () => {
      const poker = await Poker.getPoker(id);
      await poker.selectCard(socket.user, card);
      const { roomId, currentScore, currentStory } = poker;
      io.to(roomId).emit('[Poker] action', { id, currentScore, currentStory });
    });
  }

  @OnMessage('[Poker] calc method')
  async calcMethod(@ConnectedSocket() socket: Socket, @SocketIO() io: Socket, @MessageBody() { id, calcMethod }: PokerMessageBody) {
    return this.base(`User ${socket.user.id} changed calc method ${calcMethod}`, async () => {
      const poker = await Poker.getPoker(id);
      await poker.calcMethod(calcMethod);
      const { roomId, currentScore, room: { options } } = poker;
      io.to(roomId).emit('[Poker] action', { id, currentScore, options });
    });
  }

  @OnMessage('[Poker] current score')
  async changeCurrentScore(@ConnectedSocket() socket: Socket, @SocketIO() io: Socket, @MessageBody() { id, currentScore }: PokerMessageBody) {
    return this.base(`User ${socket.user.id} change current score to ${currentScore}`, async () => {
      const poker = await Poker.getPoker(id);
      await poker.changeCurrentScore(currentScore);
      const { roomId, room: { options } } = poker;
      io.to(roomId).emit('[Poker] action', { id, currentScore, options });
    });
  }

  @OnMessage('[Poker] next story')
  async nextStory(@ConnectedSocket() socket: Socket, @SocketIO() io: Socket, @MessageBody() { id }: PokerMessageBody) {
    return this.base(`User ${socket.user.id} next story for room ${id}`, async () => {
      const poker = await Poker.getPoker(id);
      await poker.nextStory();
      const { roomId, currentStory, currentScore, stories } = poker;
      io.to(roomId).emit('[Poker] action', { id, stories, currentScore, currentStory, selectedCard: null, loading: false });
    });
  }

  @OnMessage('[Poker] add story')
  async addStory(@ConnectedSocket() socket: Socket, @SocketIO() io: Socket, @MessageBody() { id, storyNames }: PokerMessageBody) {
    return this.base(`User ${socket.user.id} add story ${storyNames.join()} for room ${id}`, async () => {
      const poker = await Poker.getPoker(id);
      await poker.addStories(storyNames, socket.user);
      const { roomId, currentStory, currentScore } = poker;
      io.to(roomId).emit('[Poker] action', { id, currentScore, currentStory, selectedCard: null, loading: false });
    });
  }

  @OnMessage('[Poker] show hide score')
  async showHideScore(@ConnectedSocket() socket: Socket, @SocketIO() io: Socket, @MessageBody() { id, isNoymous }: PokerMessageBody) {
    return this.base(`User ${socket.user.id} ${isNoymous ? 'show' : 'hide' } score for room ${id}`, async () => {
      const poker = await Poker.getPoker(id);
      await poker.toggleShowHideScore(isNoymous);
      const { roomId, room: { options } } = poker;
      io.to(roomId).emit('[Poker] action', { id, options });
    });
  }

  @OnMessage('[Poker] change story name')
  async changeStoryName(@ConnectedSocket() socket: Socket, @SocketIO() io: Socket, @MessageBody() { id, name }: PokerMessageBody) {
    return this.base(`User ${socket.user.id} change story name to ${name}`, async () => {
      const poker = await Poker.getPoker(id);
      await poker.changeStoryName(name);
      const { roomId, currentStory } = poker;
      io.to(roomId).emit('[Poker] action', { id, currentStory });
    });
  }

  private async base<T>(message: string, exec: () => Promise<T>): Promise<T> {
    try {
      logger.info(message);
      return await exec();
    } catch (error) {
      logger.error(message, error);
    }
  }

}
