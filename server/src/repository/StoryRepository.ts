import { Service } from 'typedi';
import { EntityRepository, Repository } from 'typeorm';
import { Story } from '../entity';

@Service()
@EntityRepository(Story)
export class StoryRepository extends Repository<Story> {

}
