export interface PokerMessageBody {
  id: number;
  card?: number;
  calcMethod?: number;
  isNoymous?: boolean;
  currentScore?: number;
  storyNames?: string[];
}
