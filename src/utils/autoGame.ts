import { GameSettings } from '../types';

const PLAYER_NAMES = ['玩家1', '玩家2', '玩家3', '玩家4'];
const AVATARS = ['👨', '👩', '🤠', '👸'];

export const autoStartGame = async () => {
  const settings: GameSettings = {
    smallBlind: 10,
    bigBlind: 20,
    initialChips: 1000,
    maxPlayers: 4,
    gameTime: 30,
    turnTime: 30
  };

  // 自动打开4个浏览器窗口
  PLAYER_NAMES.forEach((name, index) => {
    const url = `http://localhost:3000?autoJoin=true&playerName=${name}&avatar=${AVATARS[index]}`;
    window.open(url, `player${index + 1}`, 'width=1200,height=800');
  });
};