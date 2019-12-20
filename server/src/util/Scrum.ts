import { getManager } from 'typeorm';
import { Room, Story, User, UserRoom, Score } from '../entity';
import { CalcMethod } from '../model';

export class Scrum {

  public static readonly initResults = Array(31)
    .fill(null)
    .map((v, i) => i)
    .concat([0.5, 40, 55, 89, 100])
    .sort((i, j) => i - j);

  public static async getRoom(id: number): Promise<Room> {
    return await getManager().findOneOrFail(Room, {
      relations: [
        'userRooms',
        'stories',
        'stories.scores',
      ],
      where: {
        id,
      },
    });
  }

  private timer?: NodeJS.Timer;

  private onDestory?: (scrum?: Scrum) => void;

  public room: Room;

  public currentStory: Story = null;

  public currentScore: number = null;

  constructor(room: Room, onDestory?: (scrum?: Scrum) => void) {
    this.room = room;
    this.onDestory = onDestory;
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
    const score = this.currentStory.scores.find(s => s.userId === user.id);
    score.card = card;
    score.timer = this.currentStory.timer;
    await getManager().save(Score, score);
    this.calculator();
  }

  public async calcMethod(calcMethod: CalcMethod): Promise<void> {
    this.room.options.calcMethod = calcMethod;
    await getManager().save(Room, this.room);
    this.calculator();
  }

  public async nextStory(): Promise<void> {
    if (this.currentStory) {
      this.currentStory.score = Scrum.initResults[this.currentScore];
      this.currentStory.isCompleted = true;
      await getManager().save(Story, this.currentStory);
    }

    const userIds = this.room.userRooms
      .filter(ur => !ur.isLeft && (!ur.isHost || this.room.options.needScore))
      .map(ur => ur.userId);

    await this.startNextStory(userIds);
  }

  public async changeCurrentScore(currentScore: number): Promise<void> {
    this.room.options.calcMethod = CalcMethod.Customized;
    this.currentScore = currentScore;
    await getManager().save(Room, this.room);
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
        this.room.stories.push(story);
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
      if (this.onDestory) {
        this.onDestory(this);
      }
    } else {
      const needScore = this.room.options.needScore || !userRoom.isHost;
      if (this.currentStory) {
        if (needScore) {
          await this.createScore(user.id);
        }
      } else {
        await this.startNextStory(needScore ? [user.id] : []);
      }
    }
  }

  private async startNextStory(userIds: number[]): Promise<void> {
    this.currentScore = null;
    this.currentStory = this.room.stories.find(s => !s.isDeleted && !s.isCompleted);
    if (this.currentStory) {
      if (!this.timer) {
        this.timer = setInterval(
          () => this.currentStory.timer += 1,
          1000,
        );
      }

      for (let i = 0; i < userIds.length; i += 1) {
        await this.createScore(userIds[i]);
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
    let userRoom = this.room.userRooms.find(ur => ur.userId === user.id);
    const exist = !!userRoom;
    if (!exist) {
      userRoom = new UserRoom();
      userRoom.userId = user.id;
      userRoom.roomId = this.room.id;
      userRoom.isHost = this.room.creatorId === user.id;
    }

    userRoom.isLeft = isLeft;
    await getManager().save(UserRoom, userRoom);
    if (!exist) {
      this.room.userRooms.push(userRoom);
    }

    return userRoom;
  }

  private async createScore(userId: number): Promise<Score> {
    let score = this.currentStory.scores.find(s => s.userId === userId);
    if (!score) {
      score = new Score();
      score.userId = userId;
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

    this.currentScore = Scrum.initResults.map((value, index) => ({
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
