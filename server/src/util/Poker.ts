import { getManager } from 'typeorm';
import { Room, Story, User, UserRoom, Score } from '../entity';
import { CalcMethod } from '../model';
import { formatRoomId, formatTimer, convertScore } from './Format';

export class Poker {

  public static readonly runningPokers: { [key: number]: Poker } = {};

  public static readonly initResults = Array(31)
    .fill(null)
    .map((v, i) => i)
    .concat([0.5, 40, 55, 89, 100])
    .sort((i, j) => i - j);

  public static async getPoker(id: number): Promise<Poker> {
    if (!Poker.runningPokers.hasOwnProperty(id)) {
      const room = await getManager().createQueryBuilder(Room, 'room')
        .leftJoinAndSelect('room.userRooms', 'userRoom')
        .leftJoinAndSelect('userRoom.user', 'user')
        .addSelect('room.creatorId')
        .where('room.id = :id', { id })
        .andWhere('room.isDeleted = false')
        .getOne();

      const stories = await getManager().createQueryBuilder(Story, 'story')
        .where('story.roomId = :id', { id })
        .andWhere('story.isDeleted = false')
        .andWhere('story.isCompleted = true')
        .getMany();

      stories.forEach(story => story.displayTimer = formatTimer(story.timer));
      Poker.runningPokers[id] = new Poker(room, stories);
    }

    return Poker.runningPokers[id];
  }

  private timer?: NodeJS.Timer;

  get id(): number {
    return this.room.id;
  }

  get roomId(): string {
    return formatRoomId(this.id);
  }

  public currentStory: Story = null;

  public currentScore: number = null;

  constructor(public room: Room, public stories: Story[]) {
  }

  public getRoom(user: User): any {
    const score = this.currentStory && this.currentStory.scores.find(s => s.user.id === user.id);
    return {
      id: this.id,
      name: this.room.name,
      options: this.room.options,
      stories: this.stories,
      currentStory: this.currentStory,
      currentScore: this.currentScore,
      isHost: this.room.userRooms.find(ur => ur.user.id === user.id).isHost,
      isCreator: this.room.creatorId === user.id,
      selectedCard: score ? score.card : null,
    };
  }

  public async join(user: User): Promise<void> {
    const userRoom = await this.createUserRoom(user, false);
    await this.handleTimer(user, userRoom);
  }

  public async leave(user: User): Promise<void> {
    const userRoom = await this.createUserRoom(user, true);
    await this.handleTimer(user, userRoom);
  }

  public async selectCard(user: User, card: number): Promise<void> {
    if (!this.currentStory) return;
    const score = this.currentStory.scores.find(s => s.user.id === user.id);
    score.card = card;
    score.timer = this.currentStory.timer;
    await getManager().save(Score, score);
    score.displayCard = convertScore(card);
    this.calculator();
  }

  public async calcMethod(calcMethod: CalcMethod): Promise<void> {
    this.room.options.calcMethod = calcMethod;
    await getManager().save(Room, this.room);
    this.calculator();
  }

  public async changeCurrentScore(currentScore: number): Promise<void> {
    this.room.options.calcMethod = CalcMethod.Customized;
    this.currentScore = currentScore;
    await getManager().save(Room, this.room);
  }

  public async nextStory(): Promise<void> {
    if (this.currentStory) {
      this.currentStory.score = Poker.initResults[this.currentScore];
      this.currentStory.isCompleted = true;
      this.currentStory.displayTimer = formatTimer(this.currentStory.timer);
      await getManager().save(Story, this.currentStory);
      const { scores, ...story } = this.currentStory;
      this.stories.push(story as Story);
    }

    const users = this.room.userRooms
      .filter(ur => !ur.isLeft && (!ur.isHost || this.room.options.needScore))
      .map(ur => ur.user);

    await this.startNextStory(users);
  }

  public async addStories(stories: string[], user: User): Promise<void> {
    await getManager().transaction(async (transactionalEntityManager) => {
      for (let i = 0; i < stories.length; i += 1) {
        const story = new Story();
        story.name = stories[i];
        story.roomId = this.room.id;
        story.creatorId = user.id;
        story.updaterId = user.id;
        await transactionalEntityManager.insert(Story, story);
        story.scores = [];
      }
    });

    if (!this.currentStory) {
      await this.nextStory();
    }
  }

  private async handleTimer(user: User, userRoom: UserRoom): Promise<void> {
    if (this.room.userRooms.every(r => r.isLeft)) {
      if (this.currentStory) {
        await getManager().save(Story, this.currentStory);
      }

      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }

      this.currentStory = null;
      this.currentScore = null;
      delete Poker.runningPokers[this.id];
    } else {
      const needScore = this.room.options.needScore || !userRoom.isHost;
      if (this.currentStory) {
        if (needScore) {
          await this.createScore(user);
        }
      } else {
        await this.startNextStory(needScore ? [user] : []);
      }
    }
  }

  private async startNextStory(users: User[]): Promise<void> {
    this.currentScore = null;
    this.currentStory = await getManager().createQueryBuilder(Story, 'story')
      .leftJoinAndSelect('story.scores', 'score')
      .leftJoinAndSelect('score.user', 'user')
      .where('story.roomId = :id', { id: this.id })
      .andWhere('story.isDeleted = false')
      .andWhere('story.isCompleted = false')
      .getOne() || null;

    if (this.currentStory) {
      if (!this.timer) {
        this.timer = setInterval(() => this.currentStory.timer += 1, 1000);
      }

      this.currentStory.scores.forEach(s => s.displayCard = convertScore(s.card));

      for (let i = 0; i < users.length; i += 1) {
        await this.createScore(users[i]);
      }

      this.calculator();
    } else {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }
  }

  private async createUserRoom(user: User, isLeft: boolean): Promise<UserRoom> {
    let userRoom = this.room.userRooms.find(ur => ur.user.id === user.id);
    const exist = !!userRoom;
    if (!exist) {
      userRoom = new UserRoom();
      userRoom.user = user;
      userRoom.roomId = this.room.id;
      userRoom.isHost = this.room.creatorId === user.id;
    }

    userRoom.isLeft = isLeft;
    userRoom.isDeleted = false;
    await getManager().save(UserRoom, userRoom);
    if (!exist) {
      this.room.userRooms.push(userRoom);
    }

    return userRoom;
  }

  private async createScore(user: User): Promise<Score> {
    let score = this.currentStory.scores.find(s => s.user.id === user.id);
    if (!score) {
      score = new Score();
      score.user = user;
      score.userId = user.id;
      score.storyId = this.currentStory.id;
      await getManager().save(Score, score);
      this.currentStory.scores.push(score);
    }

    return score;
  }

  private calculator(): void {
    const { calcMethod } = this.room.options;
    if (calcMethod === 3) {
      return;
    }

    const scores = this.currentStory.scores
      .map(s => s.card)
      .filter(s => s !== null && s >= 0)
      .sort((a, b) => a - b);

    if (scores.length === 0) {
      this.currentScore = null;
      return;
    }

    if (scores.length > 2 && calcMethod === 1) {
      scores.pop();
      scores.splice(0, 1);
    }

    const { length } = scores;
    let result: number;
    if (calcMethod === 0) {
      result = scores.reduce((v, s) => v + s, 0) / length;
    } else {
      result = length % 2 === 0 ?
        Math.round((scores[length / 2] + scores[length / 2 - 1]) / 2) : scores[(length - 1) / 2];
    }

    this.currentScore = Poker.initResults.map((value, index) => ({
      value,
      index,
      abs: Math.abs(value - result),
    })).sort((i, j) => {
      if (i.abs > j.abs) {
        return 1;
      }

      if (i.abs < j.abs) {
        return -1;
      }

      return j.value - i.value;
    })[0].index;
  }

}
