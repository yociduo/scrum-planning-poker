import { createConnection, getManager, getConnectionOptions } from 'typeorm';
import { config } from '../../config';
import { Room, Score, Story, User, UserRoom } from '../../entity';
import { CalcMethod } from '../../model';
import { Poker } from '../Poker';

describe('Poker', () => {
  let host: User;
  let players: User[];
  let room: Room;
  let poker: Poker;
  const onDestory = jest.fn();

  beforeAll(async () => {
    const connectionOptions = await getConnectionOptions();
    Object.assign(connectionOptions, {
      synchronize: true,
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
      for (let i = 3; i >= 0; i -= 1) {
        const user = new User();
        user.nickName = i === 0 ? '[Jest] Test Host' : `[Jest] Test Player ${i}`;
        await transactionalEntityManager.insert(User, user);
      }

      // tslint:disable-next-line: max-line-length
      [host, ...players] = await transactionalEntityManager.find(User, { take: 4, order: { id: 'DESC' } });

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
    });

    poker = await Poker.getPoker(room.id, false, onDestory);
  });

  it('get poker', async () => {
    expect(poker.room.id).toBe(room.id);
    const pokerCached = await Poker.getPoker(room.id);
    expect(pokerCached.id).toBe(poker.room.id);
    const pokerForce = await Poker.getPoker(room.id, true);
    expect(pokerForce.id).toBe(poker.room.id);
  });

  it('host join room', async () => {
    await poker.join(host);
    const userRoom = poker.room.userRooms.find(us => us.userId === host.id);
    expect(userRoom).not.toBeNull();
    expect(userRoom.isLeft).toBeFalsy();
  });

  it('host leave room', async () => {
    await poker.leave(host);
    expect(onDestory).toBeCalled();
    const userRoom = poker.room.userRooms.find(us => us.userId === host.id);
    expect(userRoom).not.toBeNull();
    expect(userRoom.isLeft).toBeTruthy();
  });

  it('on destory', async () => {
    await poker.join(host);
    await poker.leave(host);
    const times = onDestory.mock.calls.length;

    await poker.join(host);
    await poker.join(players[0]);
    await poker.leave(host);
    expect(onDestory).toBeCalledTimes(times);
    await poker.leave(players[0]);
    expect(onDestory).toBeCalledTimes(times + 1);
  });

  it('select card', async () => {
    await poker.join(host);
    const score = poker.currentStory.scores.find(s => s.userId === host.id);
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

  it('host not score', async () => {
    let room2: Room;

    await getManager().transaction(async (transactionalEntityManager) => {
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
        story.room = room2;
        story.creator = host;
        story.updater = host;
        await transactionalEntityManager.insert(Story, story);
      }
    });

    room2 = await getManager().findOneOrFail(Room, {
      relations: [
        'userRooms',
        'userRooms.user',
        'stories',
        'stories.scores',
        'stories.scores.user',
        'creator',
        'updater',
      ],
      where: {
        id: room2.id,
      },
    });

    const poker2 = new Poker(room2);
    await poker2.join(players[0]);
    await poker2.join(host);

    await poker2.leave(players[0]);
    await poker2.leave(host);

    await poker2.join(host);
    await poker2.join(players[0]);

    while (poker2.currentStory) {
      const { currentStory } = poker2;
      await poker2.nextStory();
      expect(currentStory.isCompleted).toBeTruthy();
    }
    expect(poker2.currentStory).toBeNull();

    await poker2.leave(players[0]);
    await poker2.leave(host);

    room2.isDeleted = true;
    await getManager().save(Room, room2);
  });

  afterAll(async () => {
    if (room) {
      room.isDeleted = true;
      await getManager().save(Room, room);
    }
  });

});
