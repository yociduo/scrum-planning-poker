import { createConnection, getManager, getConnectionOptions } from 'typeorm';
import { Room, Score, Story, User, UserRoom } from '../../entity';
import { CalcMethod } from '../../model';
import { Poker } from '../Poker';
import { formatTimer } from '../Format';

describe('Poker', () => {
  let host: User;
  let players: User[];
  let room: Room;
  let room2: Room;
  let poker: Poker;
  let poker2: Poker;

  beforeAll(async () => {
    const connectionOptions = await getConnectionOptions();
    Object.assign(connectionOptions, {
      synchronize: false,
      logging: false,
      bigNumberStrings: false,
      entities: [
        Room,
        Score,
        Story,
        User,
        UserRoom,
      ],
    });

    await createConnection(connectionOptions);

    await getManager().transaction(async (transactionalEntityManager) => {
      const playerCount = 4;
      for (let i = playerCount; i >= 0; i -= 1) {
        const user = new User();
        user.nickName = i === 0 ? '[Jest] Test Host' : `[Jest] Test Player ${i}`;
        await transactionalEntityManager.insert(User, user);
      }

      [host, ...players] = await transactionalEntityManager.find(User, { take: playerCount + 1, order: { id: 'DESC' } });

      room = new Room();
      room.name = '[Jest] Test Room';
      room.options = {
        needScore: true,
        isNoymous: false,
        calcMethod: CalcMethod.ArithmeticMean,
      };
      room.creatorId = host.id;
      room.updaterId = host.id;
      await transactionalEntityManager.insert(Room, room);

      for (let i = 0; i < 2; i += 1) {
        const story = new Story();
        story.name = `[Jest] Test Story ${i + 1}`;
        story.roomId = room.id;
        story.creatorId = host.id;
        story.updaterId = host.id;
        await transactionalEntityManager.insert(Story, story);
      }

      room2 = new Room();
      room2.name = '[Jest] Test Room 2';
      room2.options = {
        needScore: false,
        isNoymous: false,
        calcMethod: CalcMethod.ArithmeticMean,
      };
      room2.creator = host;
      room2.updater = host;
      await transactionalEntityManager.insert(Room, room2);

      for (let i = 0; i < 2; i += 1) {
        const story = new Story();
        story.name = `[Jest] Test Story ${i + 1}`;
        story.roomId = room2.id;
        story.creatorId = host.id;
        story.updaterId = host.id;
        await transactionalEntityManager.insert(Story, story);
      }
    });

    poker = await Poker.getPoker(room.id);
  });

  it('get poker', async () => {
    expect(poker.room.id).toBe(room.id);
    const pokerCached = await Poker.getPoker(room.id);
    expect(pokerCached).toBe(poker);
    expect(Poker.runningPokers[room.id]).toBeDefined();
  });

  it('get room id', async () => {
    expect(poker.roomId).toBe(`Room ${room.id}`);
  });

  it('host join room', async () => {
    await poker.join(host);
    const userRoom = poker.room.userRooms.find(us => us.userId === host.id);
    expect(userRoom).not.toBeNull();
    expect(userRoom.isLeft).toBeFalsy();
    const roomForHost = await poker.getRoom(host);
    expect(roomForHost.isHost).toBeTruthy();
  });

  it('host leave room', async () => {
    await poker.leave(host);
    const userRoom = poker.room.userRooms.find(us => us.userId === host.id);
    expect(userRoom).not.toBeNull();
    expect(userRoom.isLeft).toBeTruthy();
    expect(Poker.runningPokers[room.id]).toBeUndefined();
  });

  it('select card', async () => {
    await poker.join(host);
    const score = poker.currentStory.scores.find(s => s.user.id === host.id);
    expect(score).not.toBeNull();

    await poker.selectCard(host, 1);
    expect(score.card).toBe(1);
    expect(poker.currentScore).toBe(2);

    await poker.selectCard(host, 2);
    expect(score.card).toBe(2);
    expect(poker.currentScore).toBe(3);

    await poker.leave(host);
  });

  it('change current score', async () => {
    await poker.join(host);
    await poker.changeCurrentScore(1);
    expect(poker.currentScore).toBe(1);
    expect(poker.room.options.calcMethod).toBe(CalcMethod.Customized);
    await poker.leave(host);
  });

  it('change calc method', async () => {
    await poker.join(host);
    await poker.join(players[0]);
    await poker.join(players[1]);
    await poker.join(players[2]);

    await poker.selectCard(host, 1);
    await poker.selectCard(players[0], 2);
    await poker.selectCard(players[1], 10);

    await poker.calcMethod(CalcMethod.ArithmeticMean);
    expect(poker.room.options.calcMethod).toBe(CalcMethod.ArithmeticMean);
    expect(poker.currentScore).toBe(5); // [1, 2, 10] ArithmeticMean -> 4

    await poker.calcMethod(CalcMethod.TruncatedMean);
    expect(poker.room.options.calcMethod).toBe(CalcMethod.TruncatedMean);
    expect(poker.currentScore).toBe(3); // [1, 2, 10] TruncatedMean -> 2

    await poker.calcMethod(CalcMethod.Median);
    expect(poker.room.options.calcMethod).toBe(CalcMethod.Median);
    expect(poker.currentScore).toBe(3); // [1, 2, 10] Median -> 2
    await poker.selectCard(players[2], 4);
    expect(poker.currentScore).toBe(4); // [1, 2, 4, 10] Median -> 3

    await poker.calcMethod(CalcMethod.Customized);
    expect(poker.room.options.calcMethod).toBe(CalcMethod.Customized);
    expect(poker.currentScore).toBe(4); // [1, 2, 4, 10] Customized -> 3

    await poker.leave(host);
    await poker.leave(players[0]);
    await poker.leave(players[1]);
    await poker.leave(players[2]);
  });

  it('time changes', async () => {
    await poker.join(host);
    const { timer } = poker.currentStory;
    await new Promise(resolve => setTimeout(resolve, 1050));
    expect(poker.currentStory.timer).toBe(timer + 1);
    await poker.leave(host);
  });

  it('next story', async () => {
    await poker.join(host);
    while (poker.currentStory) {
      const { currentStory } = poker;
      await poker.nextStory();
      expect(currentStory.isCompleted).toBeTruthy();
    }
    expect(poker.currentStory).toBeNull();
    await poker.selectCard(host, 1);
    await poker.nextStory();
    await poker.leave(host);
    const newPoker = await Poker.getPoker(room.id);
    newPoker.stories.forEach(story => expect(story.displayTimer).toBe(formatTimer(story.timer)));
  });

  it('add stories', async () => {
    await poker.join(host);
    while (poker.currentStory) {
      await poker.nextStory();
    }
    await poker.addStories(['[Jest] Test Add Story 1'], host);
    expect(poker.currentStory).toBeDefined();
    expect(poker.currentStory.name).toBe('[Jest] Test Add Story 1');

    await poker.addStories(['[Jest] Test Add Story 2'], host);
    expect(poker.currentStory.name).toBe('[Jest] Test Add Story 1');

    await poker.leave(host);
  });

  it('toggle show/hide stories', async () => {
    await poker.toggleShowHideScore(true);
    expect(poker.room.options.isNoymous).toBe(true);

    await poker.toggleShowHideScore(false);
    expect(poker.room.options.isNoymous).toBe(false);

    await poker.toggleShowHideScore();
    expect(poker.room.options.isNoymous).toBe(true);
  });

  it('host not score', async () => {
    poker2 = await Poker.getPoker(room2.id);
    await poker2.join(players[0]);
    await poker2.join(host);

    await poker2.leave(players[0]);
    await poker2.leave(host);

    await poker2.join(host);
    await poker2.join(players[0]);

    const roomForHost = poker2.getRoom(host);
    expect(roomForHost.selectedCard).toBeNull();

    while (poker2.currentStory) {
      const { currentStory } = poker2;
      await poker2.nextStory();
      expect(currentStory.isCompleted).toBeTruthy();
    }
    expect(poker2.currentStory).toBeNull();

    await poker2.leave(players[0]);
    await poker2.leave(host);
  });

  it('join and leave very soon', async () => {
    await Promise.all([
      poker.join(players[3]),
      poker.leave(players[3]),
    ]);

    const userRooms = poker.room.userRooms.filter(us => us.userId === players[3].id);
    expect(userRooms.length).toBe(1);
    expect(userRooms[0].isLeft).toBeTruthy();
  });

  it('update story name', async () => {
    await poker.join(host);
    await poker.updateStoryName('new story name');
    expect(poker.currentStory.name).toBe('new story name');
  });

  it('disconnect', async () => {
    poker = await Poker.getPoker(room.id);
    poker2 = await Poker.getPoker(room2.id);

    await poker.join(host);
    const ur1 = poker.room.userRooms.find(us => us.userId === host.id);
    expect(ur1.isLeft).toBeFalsy();
    expect(ur1).not.toBeNull();

    await poker.join(players[0]);
    const ur2 = poker.room.userRooms.find(us => us.userId === players[0].id);
    expect(ur2).not.toBeNull();
    expect(ur2.isLeft).toBeFalsy();

    await poker2.join(players[0]);
    const ur3 = poker2.room.userRooms.find(us => us.userId === players[0].id);
    expect(ur3).not.toBeNull();
    expect(ur3.isLeft).toBeFalsy();

    await poker2.join(players[1]);
    const ur4 = poker2.room.userRooms.find(us => us.userId === players[1].id);
    expect(ur4).not.toBeNull();
    expect(ur4.isLeft).toBeFalsy();

    await Poker.disconnect(players[0]);
    expect(ur2.isLeft).toBeTruthy();
    expect(ur3.isLeft).toBeTruthy();
    expect(Poker.runningPokers[room.id]).toBeDefined();
    expect(Poker.runningPokers[room2.id]).toBeDefined();

    await Poker.disconnect(players[1]);
    expect(ur4.isLeft).toBeTruthy();
    expect(Poker.runningPokers[room.id]).toBeDefined();
    expect(Poker.runningPokers[room2.id]).toBeUndefined();

    await Poker.disconnect(host);
    expect(ur1.isLeft).toBeTruthy();
    expect(Poker.runningPokers[room.id]).toBeUndefined();
    expect(Poker.runningPokers[room2.id]).toBeUndefined();
  });

  afterAll(async () => {
    await getManager().delete(User, [host, ...players]);
  });

});
