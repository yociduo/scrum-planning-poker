import { Service } from 'typedi';
import { EntityRepository, Repository } from 'typeorm';
import { Score } from '../entity';

@Service()
@EntityRepository(Score)
export class ScoreRepository extends Repository<Score> {

}
