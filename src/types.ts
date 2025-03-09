// 游戏阶段和状态的类型定义
export type GamePhase = 'waiting' | 'preFlop' | 'flop' | 'turn' | 'river' | 'showdown';
export type RoomStatus = 'waiting' | 'playing' | 'finished';
export type GameStatus = 'betting' | 'showdown';

// 游戏设置类型定义
export interface GameSettings {
  smallBlind: number;
  bigBlind: number;
  initialChips: number;
  maxPlayers: number;
  gameTime: number;   // 单位：分钟
  turnTime: number;   // 单位：秒
}

// 玩家类型定义
export interface Player {
  id: string;
  name: string;
  avatar: string;
  chips: number;
  cards: string[];
  bet: number;
  isActive: boolean;
  isHost: boolean;    // 必需属性
  score: number;
}

// 游戏状态类型定义
export interface GameState {
  phase: GamePhase;
  communityCards: string[];
  pot: number;
  players: Player[];
  currentTurn: string;
  currentBet: number;
  lastRaiseAmount: number;
  status: GameStatus;
}

// 房间类型定义
export interface Room {
  id: string;
  players: Player[];
  settings: GameSettings;
  gameState: GameState;
  deck: string[];
  pot: number;
  currentTurn: number;
  communityCards: string[];
  status: RoomStatus;
}