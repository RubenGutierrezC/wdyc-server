export interface Config {
  rounds?: number;
}

export interface ReceiveCard {
  username: string;
  card: string;
}

interface judgeCard {
  url: string;
  imageOrientation: string;
}

export interface Judge {
  card: judgeCard;
  username: string;
  receivedCards: ReceiveCard[];
}

export interface Player {
  username: string;
  numberOfWins: number;
  cards: any[];
  socketId: string;
}

export interface Room {
  roomCreator: string;
  config: Config;
  round: number;
  playerCards: string[];
  judgeCards: judgeCard[];
  judge: Judge;
  winner: string;
  players: Player[];
  isStarted: boolean;
}
