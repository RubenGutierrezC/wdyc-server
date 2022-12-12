export interface Config {
  rounds?: number;
}

export interface ReceiveCard {
  username: string;
  card: string;
}

export interface Judge {
  card: string;
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
  judgeCards: string[];
  judge: Judge;
  winner: string;
  players: Player[];
  isStarted: boolean;
}
