import { Service } from 'typedi';
import { Repository, EntityRepository, getManager } from 'typeorm';
import { Room, User, Story } from '../entity';
import { formatTimer, convertScore } from '../util';

@Service()
@EntityRepository(Room)
export class RoomRepository extends Repository<Room> {

  async getListByUser(user: User): Promise<Room[]> {
    const { raw, entities } = await this.createQueryBuilder('room')
      .leftJoin('room.stories', 'story')
      .leftJoin('room.userRooms', 'userRoom')
      .where('userRoom.userId = :id', { id: user.id })
      .andWhere('room.isDeleted = false')
      .andWhere('story.isDeleted = false')
      .andWhere('userRoom.isDeleted = false')
      .addSelect('userRoom.isHost', 'isHost')
      .addSelect(`room.creatorId = ${user.id}`, 'isCreator')
      .addSelect('SUM(!story.isCompleted) = 0', 'isCompleted')
      .addSelect('COUNT(story.id)', 'storyCount')
      .addSelect('IFNULL(SUM(story.score), 0)', 'scoreSum')
      .addSelect('SUM(story.timer)', 'timerSum')
      .groupBy('room.id')
      .addGroupBy('userRoom.id')
      .orderBy('room.createdAt', 'DESC')
      .getRawAndEntities();

    entities.forEach((entity, index) => {
      entity.isHost = !!raw[index].isHost;
      entity.isCreator = !!raw[index].isCreator;
      entity.isCompleted = !!raw[index].isCompleted;
      entity.storyCount = raw[index].storyCount;
      entity.scoreSum = raw[index].scoreSum;
      entity.timerSum = raw[index].timerSum;
      delete entity.userRooms;
      entity.displayTimerSum = formatTimer(entity.timerSum);
    });

    return entities;
  }

  async getByUser(id: number, user: User): Promise<Room> {
    const room = await this.createQueryBuilder('room')
      .leftJoinAndSelect('room.stories', 'story')
      .leftJoinAndSelect('story.scores', 'score')
      .leftJoinAndSelect('score.user', 'scuserore')
      .leftJoin('room.userRooms', 'userRoom')
      .where('userRoom.userId = :id', { id: user.id })
      .where('userRoom.roomId = :id', { id })
      .andWhere('room.isDeleted = false')
      .andWhere('story.isDeleted = false')
      .andWhere('userRoom.isDeleted = false')
      .getOne();

    room.storyCount = 0;
    room.timerSum = 0;
    room.scoreSum = 0;
    room.stories.forEach((story) => {
      story.displayTimer = formatTimer(story.timer);
      room.storyCount = room.storyCount + 1;
      room.timerSum += story.timer;
      room.scoreSum += story.score;
    });
    room.displayTimerSum = formatTimer(room.timerSum);

    return room;
  }

  async check(id: number): Promise<boolean> {
    return (await this.createQueryBuilder('room')
      .leftJoin('room.stories', 'story')
      .where('room.id = :id', { id })
      .andWhere('story.isDeleted = false')
      .groupBy('room.id')
      .having('COUNT(story.id) = SUM(story.isCompleted)')
      .getCount()) > 0;
  }

  async createWithStory(user: User, room: Room): Promise<Room> {
    const newRoom = new Room();
    await getManager().transaction(async (transactionalEntityManager) => {
      newRoom.name = room.name;
      newRoom.options = room.options;
      newRoom.creator = user;
      newRoom.updater = user;
      await transactionalEntityManager.insert(Room, newRoom);

      for (let i = 0; i < room.stories.length; i++) {
        const newStory = new Story();
        newStory.name = room.stories[i].name;
        newStory.room = newRoom;
        newStory.creator = user;
        newStory.updater = user;
        await transactionalEntityManager.insert(Story, newStory);
      }
    });
    return newRoom;
  }

}
