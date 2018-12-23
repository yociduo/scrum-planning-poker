import { Room } from '../entity/Room';

export class Scrum {

  private timer?: NodeJS.Timer;

  constructor(public room: Room) {
  }
}
