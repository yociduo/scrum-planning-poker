export interface PokerMessageBody {
  id: number;
  card?: number;
  calcMethod?: number;
  currentScore?: number;
  storyNames?: string[];
}
