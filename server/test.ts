import { io as Client } from 'socket.io-client';

// 创建三个玩家的连接
const player1 = Client('http://localhost:3001'); // 房主
const player2 = Client('http://localhost:3001');
const player3 = Client('http://localhost:3001');

let roomId: string;

// 房主创建房间
player1.on('connect', () => {
  console.log('房主已连接');
  player1.emit('createRoom', {
    maxPlayers: 9,
    initialChips: 1000,
    smallBlind: 10,
    bigBlind: 20
  });
});

player1.on('roomCreated', (id: string) => {
  roomId = id;
  console.log('房间已创建，ID:', roomId);
  
  // 房主加入房间
  player1.emit('joinRoom', {
    roomId,
    playerName: '玩家1',
    avatar: 'avatar1.png'
  });

  // 其他玩家加入房间
  player2.emit('joinRoom', {
    roomId,
    playerName: '玩家2',
    avatar: 'avatar2.png'
  });

  player3.emit('joinRoom', {
    roomId,
    playerName: '玩家3',
    avatar: 'avatar3.png'
  });
});

// 监听玩家加入事件
player1.on('playerJoined', (players: { name: string }[]) => {
  console.log('玩家已加入，当前玩家:', players.map((p: { name: string }) => p.name));
  if (players.length === 3) {
    // 所有玩家都加入后，房主开始游戏
    player1.emit('startGame', roomId);
  }
});

// 监听游戏开始事件
player1.on('gameStarted', (room) => {
  console.log('游戏开始！');
  console.log('初始状态:', room);
});

// 监听游戏状态更新
player1.on('gameStateUpdated', (state) => {
  console.log('游戏状态更新:', state);
});

// 监听回合结束
player1.on('roundEnded', (result) => {
  console.log('回合结束:', result);
});

// 监听游戏结束
player1.on('gameEnded', (result) => {
  console.log('游戏结束:', result);
});

// 错误处理
player1.on('error', (error) => {
  console.error('错误:', error);
});