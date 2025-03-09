export interface Room {
  id: string;
  players: Player[];
  settings: GameSettings;
  gameState: GameState;
  deck: string[];
  pot: number;
  currentTurn: number;
  communityCards: string[];
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  chips: number;
  cards: string[];
  bet: number;
  isActive: boolean;
  isHost: boolean;
  score: number;
}

export interface GameSettings {
  smallBlind: number;
  bigBlind: number;
  initialChips: number;
  timeLimit: number;
  turnTime: number;
  maxPlayers: number;
}

export interface GameState {
  phase: 'waiting' | 'preFlop' | 'flop' | 'turn' | 'river' | 'showdown';
  currentBet: number;
  lastRaiseAmount: number;
}