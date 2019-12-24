import { createConnection, getManager, getConnectionOptions } from 'typeorm';
import { config } from '../../config';
import { Room, Score, Story, User, UserRoom } from '../../entity';
import { CalcMethod } from '../../model';
import { Scrum } from '../Scrum';

describe('Scrum', () => {
  let host: User;
  let players: User[];
  let room: Room;
  let scrum: Scrum;
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
    if (connectionOptions.type === 'mysql') {
      Object.assign(connectionOptions, { bigNumberStrings: true });
    }

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

    room = await Scrum.getRoom(room.id);
    scrum = new Scrum(room, onDestory);
  });

  it('get room', async () => {
    const room = await Scrum.getRoom(scrum.room.id);
    expect(room.id).toBe(scrum.room.id);
    const roomCached = await Scrum.getRoom(scrum.room.id);
    expect(roomCached.id).toBe(scrum.room.id);
    const roomForce = await Scrum.getRoom(scrum.room.id, true);
    expect(roomForce.id).toBe(scrum.room.id);
  });

  it('host join room', async () => {
    await scrum.join(host);
    const userRoom = scrum.room.userRooms.find(us => us.userId === host.id);
    expect(userRoom).not.toBeNull();
    expect(userRoom.isLeft).toBeFalsy();
  });

  it('host leave room', async () => {
    await scrum.leave(host);
    expect(onDestory).toBeCalled();
    const userRoom = scrum.room.userRooms.find(us => us.userId === host.id);
    expect(userRoom).not.toBeNull();
    expect(userRoom.isLeft).toBeTruthy();
  });

  it('on destory', async () => {
    await scrum.join(host);
    await scrum.leave(host);
    const times = onDestory.mock.calls.length;

    await scrum.join(host);
    await scrum.join(players[0]);
    await scrum.leave(host);
    expect(onDestory).toBeCalledTimes(times);
    await scrum.leave(players[0]);
    expect(onDestory).toBeCalledTimes(times + 1);
  });

  it('select card', async () => {
    await scrum.join(host);
    const score = scrum.currentStory.scores.find(s => s.userId === host.id);
    expect(score).not.toBeNull();

    await scrum.selectCard(host, 1);
    expect(score.card).toBe(1);
    expect(scrum.currentScore).toBe(2);

    await scrum.selectCard(host, 2);
    expect(score.card).toBe(2);
    expect(scrum.currentScore).toBe(3);

    await scrum.leave(host);
  });

  it('change current score', async () => {
    await scrum.join(host);
    await scrum.changeCurrentScore(1);
    expect(scrum.currentScore).toBe(1);
    expect(scrum.room.options.calcMethod).toBe(CalcMethod.Customized);
    await scrum.leave(host);
  });

  it('change calc method', async () => {
    await scrum.join(host);
    await scrum.join(players[0]);
    await scrum.join(players[1]);
    await scrum.join(players[2]);

    await scrum.selectCard(host, 1);
    await scrum.selectCard(players[0], 2);
    await scrum.selectCard(players[1], 10);

    await scrum.calcMethod(CalcMethod.ArithmeticMean);
    expect(scrum.room.options.calcMethod).toBe(CalcMethod.ArithmeticMean);
    expect(scrum.currentScore).toBe(5); // [1, 2, 10] ArithmeticMean -> 4

    await scrum.calcMethod(CalcMethod.TruncatedMean);
    expect(scrum.room.options.calcMethod).toBe(CalcMethod.TruncatedMean);
    expect(scrum.currentScore).toBe(3); // [1, 2, 10] TruncatedMean -> 2

    await scrum.calcMethod(CalcMethod.Median);
    expect(scrum.room.options.calcMethod).toBe(CalcMethod.Median);
    expect(scrum.currentScore).toBe(3); // [1, 2, 10] Median -> 2
    await scrum.selectCard(players[2], 4);
    expect(scrum.currentScore).toBe(4); // [1, 2, 4, 10] Median -> 3

    await scrum.calcMethod(CalcMethod.Customized);
    expect(scrum.room.options.calcMethod).toBe(CalcMethod.Customized);
    expect(scrum.currentScore).toBe(4); // [1, 2, 4, 10] Customized -> 3

    await scrum.leave(host);
    await scrum.leave(players[0]);
    await scrum.leave(players[1]);
    await scrum.leave(players[2]);
  });

  it('time changes', async () => {
    await scrum.join(host);
    const { timer } = scrum.currentStory;
    await new Promise(resolve => setTimeout(resolve, 1050));
    expect(scrum.currentStory.timer).toBe(timer + 1);
    await scrum.leave(host);
  });

  it('next story', async () => {
    await scrum.join(host);
    while (scrum.currentStory) {
      const { currentStory } = scrum;
      await scrum.nextStory();
      expect(currentStory.isCompleted).toBeTruthy();
    }
    expect(scrum.currentStory).toBeUndefined();
    await scrum.selectCard(host, 1);
    await scrum.nextStory();
    await scrum.leave(host);
  });

  it('add stories', async () => {
    await scrum.join(host);
    while (scrum.currentStory) {
      await scrum.nextStory();
    }
    await scrum.addStories(['[Jest] Test Add Story 1'], host);
    expect(scrum.currentStory).toBeDefined();
    expect(scrum.currentStory.name).toBe('[Jest] Test Add Story 1');

    await scrum.addStories(['[Jest] Test Add Story 2'], host);
    expect(scrum.currentStory.name).toBe('[Jest] Test Add Story 1');

    await scrum.leave(host);
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

    const scrum2 = new Scrum(room2);
    await scrum2.join(players[0]);
    await scrum2.join(host);

    await scrum2.leave(players[0]);
    await scrum2.leave(host);

    await scrum2.join(host);
    await scrum2.join(players[0]);

    while (scrum2.currentStory) {
      const { currentStory } = scrum2;
      await scrum2.nextStory();
      expect(currentStory.isCompleted).toBeTruthy();
    }
    expect(scrum2.currentStory).toBeUndefined();

    await scrum2.leave(players[0]);
    await scrum2.leave(host);

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
