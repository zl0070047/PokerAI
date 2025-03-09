import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, Paper, Container, ThemeProvider } from '@mui/material';
import { io, Socket } from 'socket.io-client';
import { styled } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';

// 创建默认主题
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

export { theme };

// 类型定义
interface GameProps {
  roomId: string;
  playerName: string;
  avatar: string;
}

interface Player {
  id: string;
  name: string;
  avatar: string;
  chips: number;
  cards: string[];
  bet: number;
  isHost?: boolean;
}

interface GameState {
  communityCards: string[];
  pot: number;
  players: Player[];
  currentTurn: string;
  currentBet: number;
}

// 样式组件
const PokerTable = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  background: 'linear-gradient(145deg, #0B4F1F, #073C17)',
  borderRadius: '50%',
  border: '20px solid #654321',
  position: 'relative',
  width: '800px',
  height: '400px',
  margin: '20px auto'
}));

const Card = styled(Box)(({ theme }) => ({
  display: 'inline-block',
  width: '40px',
  height: '60px',
  margin: '0 2px',
  background: '#fff',
  borderRadius: '5px',
  textAlign: 'center',
  lineHeight: '60px',
  fontSize: '20px',
  fontWeight: 'bold',
  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
  '&.red': {
    color: '#DC143C'
  },
  '&.black': {
    color: '#000'
  }
}));

const PlayerSeat = styled(Box)(({ theme }) => ({
  position: 'absolute',
  width: '120px',
  padding: theme.spacing(1),
  background: 'rgba(0,0,0,0.7)',
  borderRadius: '10px',
  color: '#FFD700',
  textAlign: 'center'
}));

const ActionButton = styled(Button)(({ theme }) => ({
  minWidth: '100px',
  fontWeight: 'bold',
  textTransform: 'none'
}));

// Game 组件
const Game: React.FC<GameProps> = ({ roomId, playerName, avatar }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);
  
    // 添加创建房间成功的监听
    newSocket.on('roomCreated', (roomData) => {
      setGameState({
        ...roomData,
        players: roomData.players || [],
        communityCards: [],
        pot: 0,
        currentBet: 0
      });
    });
  
    // 添加错误处理
    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      alert(error.message || '发生错误，请重试');
    });
  
    newSocket.emit('joinGame', { roomId, playerName, avatar });
  
    newSocket.on('gameStateUpdated', (newState: GameState) => {
      setGameState(newState);
      const player = newState.players.find(p => p.name === playerName);
      if (player) {
        setCurrentPlayer(player);
      }
    });
  
    return () => {
      newSocket.disconnect();
    };
  }, [roomId, playerName, avatar]);

  const handleAction = (action: string, amount?: number) => {
    if (!socket || !gameState) return;
    socket.emit('playerAction', {
      type: action,
      amount,
      roomId,
      playerName
    });
  };

  const getCardColor = (card: string): string => {
    return ['♥', '♦'].includes(card.slice(-1)) ? 'red' : 'black';
  };

  if (!gameState) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>加载中...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <PokerTable>
        {/* 公共牌区域 */}
        <Box sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          gap: 1
        }}>
          {gameState.communityCards.map((card, index) => (
            <Card key={index} className={getCardColor(card)}>
              {card}
            </Card>
          ))}
          <Typography sx={{ 
            position: 'absolute',
            bottom: '-30px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#FFD700',
            fontWeight: 'bold'
          }}>
            奖池: ${gameState.pot}
          </Typography>
        </Box>

        {/* 玩家座位 */}
        {gameState.players.map((player, index) => {
          // 4个玩家的位置配置
          const positions = [
            { top: '85%', left: '50%' },  // 下
            { top: '50%', left: '10%' },  // 左
            { top: '15%', left: '50%' },  // 上
            { top: '50%', left: '90%' },  // 右
          ];

          return (
            <PlayerSeat
              key={player.id}
              sx={{
                ...positions[index],
                transform: 'translate(-50%, -50%)',
                border: player.id === gameState.currentTurn ? '2px solid #FFD700' : 'none',
                boxShadow: player.id === gameState.currentTurn ? '0 0 15px #FFD700' : 'none'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <Typography sx={{ mr: 1 }}>{player.avatar}</Typography>
                <Typography>{player.name}</Typography>
                {player.isHost && <Typography sx={{ ml: 1 }}>👑</Typography>}
              </Box>
              <Typography>筹码: ${player.chips}</Typography>
              <Typography>下注: ${player.bet}</Typography>
              {player.name === playerName && (
                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                  {player.cards.map((card, i) => (
                    <Card key={i} className={getCardColor(card)}>
                      {card}
                    </Card>
                  ))}
                </Box>
              )}
            </PlayerSeat>
          );
        })}

        {/* 操作按钮 */}
        {currentPlayer && gameState.currentTurn === currentPlayer.id && (
          <Box sx={{
            position: 'absolute',
            bottom: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 2,
            zIndex: 1
          }}>
            <ActionButton
              variant="contained"
              color="error"
              onClick={() => handleAction('fold')}
            >
              弃牌
            </ActionButton>
            <ActionButton
              variant="contained"
              color="primary"
              onClick={() => handleAction('call')}
            >
              跟注 (${gameState.currentBet})
            </ActionButton>
            <ActionButton
              variant="contained"
              color="success"
              onClick={() => handleAction('raise', gameState.currentBet * 2)}
            >
              加注
            </ActionButton>
          </Box>
        )}
      </PokerTable>
    </Container>
  );
};

export default Game;