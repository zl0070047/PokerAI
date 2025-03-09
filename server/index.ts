import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { evaluateHand, compareHands } from './poker';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// 定义房间接口
// 定义玩家接口
interface Player {
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

// 定义游戏设置接口
interface GameSettings {
  maxPlayers: number;
  initialChips: number;
  smallBlind: number;
  bigBlind: number;
}

interface Room {
  id: string;
  players: Player[];
  settings: GameSettings;
  gameState: {
    phase: string;
    currentBet: number;
    lastRaiseAmount: number;
  };
  deck: string[];
  pot: number;
  currentTurn: number;
  communityCards: string[];
}

const rooms = new Map<string, Room>();

io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);

  socket.on('createRoom', (settings: GameSettings) => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const room: Room = {
      id: roomId,
      players: [],
      settings,
      gameState: {
        phase: 'waiting',
        currentBet: 0,
        lastRaiseAmount: 0
      },
      deck: [],
      pot: 0,
      currentTurn: 0,
      communityCards: []
    };
    rooms.set(roomId, room);
    socket.join(roomId);
    socket.emit('roomCreated', roomId);
  });

  // 加入房间
  socket.on('joinRoom', ({ roomId, playerName, avatar }) => {
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit('error', '房间不存在');
      return;
    }

    if (room.players.length >= (room.settings.maxPlayers || 9)) {
      socket.emit('error', '房间已满');
      return;
    }

    const isHost = room.players.length === 0;
    
    const player: Player = {
      id: socket.id,
      name: playerName,
      avatar,
      chips: room.settings.initialChips,
      cards: [],
      bet: 0,
      isActive: true,
      isHost,
      score: 0
    };

    room.players.push(player);
    socket.join(roomId);
    io.to(roomId).emit('playerJoined', room.players);
  });

  // 离开房间
  socket.on('leaveRoom', (roomId: string) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const updatedPlayers = room.players.filter(p => p.id !== socket.id);
    
    if (updatedPlayers.length > 0) {
      // 如果离开的是房主，将房主权限转移给第一个玩家
      if (room.players.find(p => p.id === socket.id)?.isHost) {
        updatedPlayers[0].isHost = true;
      }
      room.players = updatedPlayers;
    } else {
      rooms.delete(roomId);
    }
    
    socket.leave(roomId);
    io.to(roomId).emit('playerJoined', updatedPlayers);
  });

  // 开始游戏
  socket.on('startGame', (roomId: string) => {
    const room = rooms.get(roomId);
    if (!room) return;
  
    const player = room.players.find(p => p.id === socket.id);
    if (!player?.isHost) return;
  
    if (room.players.length < 2) {
      socket.emit('error', '至少需要2名玩家才能开始游戏');
      return;
    }
  
    // 初始化游戏状态
    room.gameState.phase = 'pre-flop'; // 修改为翻牌前阶段
    room.gameState.currentBet = room.settings.bigBlind;
    room.deck = initializeDeck();
    room.pot = room.settings.smallBlind + room.settings.bigBlind;
    
    // 设置小盲注和大盲注位置
    const smallBlindPos = 0;
    const bigBlindPos = 1;
    
    // 收取盲注
    room.players[smallBlindPos].chips -= room.settings.smallBlind;
    room.players[smallBlindPos].bet = room.settings.smallBlind;
    room.players[bigBlindPos].chips -= room.settings.bigBlind;
    room.players[bigBlindPos].bet = room.settings.bigBlind;
    
    // 设置起始行动位置（从大盲注后一位开始）
    room.currentTurn = (bigBlindPos + 1) % room.players.length;

    room.communityCards = [];

    // 重置玩家状态
    room.players.forEach(player => {
      player.cards = [];
      player.bet = 0;
      player.isActive = true;
    });

    // 发牌给每个玩家
    room.players.forEach(player => {
      const card1 = room.deck.pop();
      const card2 = room.deck.pop();
      if (card1 && card2) {
        player.cards = [card1, card2];
      } else {
        // 如果牌堆为空，抛出错误
        throw new Error('牌堆已空');
      }
    });
        io.to(roomId).emit('gameStarted', room);
      });

      // 玩家操作
      // 添加游戏状态验证函数
      // 添加游戏状态验证函数
      function validateGameState(room: Room): boolean {
        if (!room) return false;
        
        const activePlayers = room.players.filter(p => p.isActive);
        if (activePlayers.length < 2) return false;
        
        const totalBets = room.players.reduce((sum, p) => sum + p.bet, 0);
        if (totalBets !== room.pot) return false;
        
        return true;
      }
      
      // 添加玩家操作验证函数
      function validatePlayerAction(room: Room, playerIndex: number, action: { type: string, amount?: number }): boolean {
        const player = room.players[playerIndex];
        const currentBet = room.gameState.currentBet;
        const playerBet = player.bet;
        const minRaise = currentBet + room.gameState.lastRaiseAmount;
      
        switch (action.type) {
          case 'fold':
            return true;
          case 'call':
            return player.chips >= (currentBet - playerBet);
          case 'raise':
            if (!action.amount) return false;
            return player.chips >= (action.amount - playerBet) && action.amount >= minRaise;
          case 'check':
            return playerBet === currentBet;
          default:
            return false;
        }
      }
      
      // 修改玩家操作处理函数
      socket.on('playerAction', (action: { type: string, amount?: number }, roomId: string) => {
        const room = rooms.get(roomId);
        if (!room) {
          socket.emit('error', '房间不存在');
          return;
        }
      
        if (!validateGameState(room)) {
          socket.emit('error', '游戏状态异常');
          return;
        }
      
        const playerIndex = room.players.findIndex(p => p.id === socket.id);
        if (playerIndex === -1 || playerIndex !== room.currentTurn) {
          socket.emit('error', '不是您的回合');
          return;
        }
      
        if (!validatePlayerAction(room, playerIndex, action)) {
          socket.emit('error', '无效的操作');
          return;
        }
      
        handlePlayerAction(room, playerIndex, action);
        updateGameState(room);
        
        // 发送更新后的游戏状态，但隐藏其他玩家的手牌
        const gameState = {
          ...room,
          players: room.players.map(p => ({
            ...p,
            cards: p.id === socket.id ? p.cards : []
          }))
        };
        
        io.to(roomId).emit('gameStateUpdated', gameState);
      });
      
      // 添加游戏结束检查函数
      function checkGameEnd(room: Room): boolean {
        const playersWithChips = room.players.filter(p => p.chips > 0);
        return playersWithChips.length <= 1;
      }
      
      // 修改回合结束函数
      // 添加手牌类型定义
      // 修改 Hand 接口定义，使其与 poker.ts 中的 HandRank 接口匹配
      interface Hand {
      name: string;
      value: number[];  // 修改为 number[] 类型
      cards: string[];
      rank: number;     // 添加 rank 属性
      }
      
      // 修改回合结束函数中的类型声明
      function endRound(room: Room) {
        const activePlayers = room.players.filter(p => p.isActive);
        let winners: Player[] = [];
        let winningHand: Hand | null = null;
      
        if (activePlayers.length === 1) {
          winners = activePlayers;
        } else {
          const playerHands = activePlayers.map(player => ({
            player,
            hand: evaluateHand(player.cards, room.communityCards)
          }));
      
// 修改 winningHand 的赋值部分
winningHand = {
...playerHands[0].hand,  // 使用展开运算符包含所有属性
cards: [...playerHands[0].player.cards, ...room.communityCards].slice(0, 5)
};
          winners = [playerHands[0].player];
      
          for (let i = 1; i < playerHands.length; i++) {
            // 确保 winningHand 不为 null 再进行比较
            if (winningHand) {
              const comparison = compareHands(playerHands[i].hand, winningHand);
              if (comparison > 0) {
                winningHand = {
                  ...playerHands[i].hand,
                  cards: [...playerHands[i].player.cards, ...room.communityCards].slice(0, 5),
                  rank: playerHands[i].hand.rank
                };
                winners = [playerHands[i].player];
              } else if (comparison === 0) {
                winners.push(playerHands[i].player);
              }
            }
          }
        }
      
        // 分配奖池
        const winAmount = Math.floor(room.pot / winners.length);
        winners.forEach(winner => {
          winner.chips += winAmount;
        });
      
        // 发送回合结束事件
        io.to(room.id).emit('roundEnded', {
          winners: winners.map(w => ({
            id: w.id,
            name: w.name,
            cards: w.cards,
            handType: winningHand?.name
          })),
          pot: room.pot,
          communityCards: room.communityCards
        });
      
        // 检查游戏是否结束
        if (checkGameEnd(room)) {
          const winner = room.players.find(p => p.chips > 0);
          io.to(room.id).emit('gameEnded', {
            winner: winner ? {
              id: winner.id,
              name: winner.name,
              chips: winner.chips
            } : null
          });
          room.gameState.phase = 'ended';
        } else {
          // 准备下一轮
          prepareNextRound(room);
        }
      }
      
      // 添加下一轮准备函数
      function prepareNextRound(room: Room) {
        // 移动盲注位置
        room.players.push(room.players.shift()!);
        
        // 重置游戏状态
        room.gameState.phase = 'pre-flop';
        room.gameState.currentBet = room.settings.bigBlind;
        room.deck = initializeDeck();
        room.pot = room.settings.smallBlind + room.settings.bigBlind;
        room.communityCards = [];
        
        // 重置玩家状态
        room.players.forEach((player, index) => {
          player.cards = [];
          player.bet = 0;
          player.isActive = player.chips > 0;
          
          // 设置盲注
          if (index === 0) { // 小盲注
            player.chips -= room.settings.smallBlind;
            player.bet = room.settings.smallBlind;
          } else if (index === 1) { // 大盲注
            player.chips -= room.settings.bigBlind;
            player.bet = room.settings.bigBlind;
          }
        });
        
        // 发牌
        room.players.forEach(player => {
          if (player.isActive) {
            const card1 = room.deck.pop();
            const card2 = room.deck.pop();
            if (card1 && card2) {
              player.cards = [card1, card2];
            }
          }
        });
        
        // 设置起始行动位置
        room.currentTurn = 2 % room.players.length;
        while (!room.players[room.currentTurn].isActive) {
          room.currentTurn = (room.currentTurn + 1) % room.players.length;
        }
        
        io.to(room.id).emit('newRound', room);
      }

      // 断开连接
      socket.on('disconnect', () => {
        rooms.forEach((room, roomId) => {
          const playerIndex = room.players.findIndex(p => p.id === socket.id);
          if (playerIndex !== -1) {
            const isHost = room.players[playerIndex].isHost;
            room.players.splice(playerIndex, 1);
            
            if (room.players.length === 0) {
              rooms.delete(roomId);
            } else {
              if (isHost) {
                room.players[0].isHost = true;
              }
              io.to(roomId).emit('playerLeft', room.players);
            }
          }
        });
      });
  });

  // 添加扑克牌初始化函数
  function initializeDeck(): string[] {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck: string[] = [];  // 明确指定数组类型
    
    for (const suit of suits) {
      for (const value of values) {
        deck.push(value + suit);
      }
    }
    
    // Fisher-Yates 洗牌算法
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    return deck;
  }

  // 添加玩家操作处理函数
  function validateGameState(room: Room): boolean {
    if (!room) return false;
    const activePlayers = room.players.filter(p => p.isActive);
    if (activePlayers.length < 2) return false;
    const totalBets = room.players.reduce((sum, p) => sum + p.bet, 0);
    return totalBets === room.pot;
  }

  function validatePlayerAction(room: Room, playerIndex: number, action: { type: string, amount?: number }): boolean {
    const player = room.players[playerIndex];
    const currentBet = room.gameState.currentBet;
    const playerBet = player.bet;
    const minRaise = currentBet + room.gameState.lastRaiseAmount;

    switch (action.type) {
      case 'fold': return true;
      case 'call': return player.chips >= (currentBet - playerBet);
      case 'raise': return action.amount ? player.chips >= (action.amount - playerBet) && action.amount >= minRaise : false;
      case 'check': return playerBet === currentBet;
      default: return false;
    }
  }

  function handlePlayerAction(room: Room, playerIndex: number, action: { type: string, amount?: number }) {
    const player = room.players[playerIndex];
    
    switch (action.type) {
      case 'fold':
        player.isActive = false;
        break;
      case 'call':
        const callAmount = room.gameState.currentBet - player.bet;
        player.chips -= callAmount;
        player.bet += callAmount;
        room.pot += callAmount;
        break;
      case 'raise':
        if (action.amount && action.amount > room.gameState.currentBet) {
          const raiseAmount = action.amount - player.bet;
          player.chips -= raiseAmount;
          player.bet += raiseAmount;
          room.pot += raiseAmount;
          room.gameState.currentBet = action.amount;
          room.gameState.lastRaiseAmount = action.amount - room.gameState.currentBet;
        }
        break;
    }
  }

  // 添加游戏状态更新函数
  function updateGameState(room: Room) {
    const activePlayers = room.players.filter(p => p.isActive);
    
    // 检查是否只剩一个玩家
    if (activePlayers.length === 1) {
      endRound(room);
      return;
    }
    
    // 更新当前玩家回合
    do {
      room.currentTurn = (room.currentTurn + 1) % room.players.length;
    } while (!room.players[room.currentTurn].isActive);
    
    // 检查是否需要进入下一阶段
    const allPlayersActed = room.players.every(p => 
      !p.isActive || p.bet === room.gameState.currentBet
    );
    
    if (allPlayersActed) {
      advanceGamePhase(room);
    }
  }

  // 添加游戏阶段推进函数
  // 修改游戏阶段推进函数
  function advanceGamePhase(room: Room) {
    switch (room.gameState.phase) {
      case 'pre-flop':
        room.gameState.phase = 'flop';
        room.communityCards = room.deck.splice(0, 3);
        break;
      case 'flop':
        room.gameState.phase = 'turn';
        room.communityCards.push(room.deck.pop()!);
        break;
      case 'turn':
        room.gameState.phase = 'river';
        room.communityCards.push(room.deck.pop()!);
        break;
      case 'river':
        endRound(room);
        break;
    }
    
    // 重置下注状态，但保留玩家的活跃状态
    room.gameState.currentBet = 0;
    room.players.forEach(p => {
      if (p.isActive) {
        p.bet = 0;
      }
    });
    
    // 设置新一轮的起始行动位置（从小盲注开始）
    room.currentTurn = 0;
    while (!room.players[room.currentTurn].isActive) {
      room.currentTurn = (room.currentTurn + 1) % room.players.length;
    }
  }

  // 添加回合结束函数
  function endRound(room: Room) {
    const activePlayers = room.players.filter(p => p.isActive);
    
    if (activePlayers.length === 1) {
      // 只剩一个玩家，直接获胜
      const winner = activePlayers[0];
      winner.chips += room.pot;
    } else {
      // 计算每个玩家的最佳牌型
      const playerHands = activePlayers.map(player => ({
        player,
        hand: evaluateHand(player.cards, room.communityCards)
      }));
      
      // 找出最大牌型
      let bestHand = playerHands[0];
      let winners = [playerHands[0].player];
      
      for (let i = 1; i < playerHands.length; i++) {
        const comparison = compareHands(playerHands[i].hand, bestHand.hand);
        if (comparison > 0) {
          bestHand = playerHands[i];
          winners = [playerHands[i].player];
        } else if (comparison === 0) {
          winners.push(playerHands[i].player);
        }
      }
      
      // 分配奖池
      const winAmount = Math.floor(room.pot / winners.length);
      winners.forEach(winner => {
        winner.chips += winAmount;
      });
    }
    
    // 重置游戏状态
    room.gameState.phase = 'waiting';
    room.pot = 0;
    room.communityCards = [];
    
    io.to(room.id).emit('roundEnded', room);
  }

  // 修复服务器启动代码
  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
  });