import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Container, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Avatar, 
  Slider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ThemeProvider,
  createTheme
} from '@mui/material';
import { styled } from '@mui/material/styles';
import Game from './components/Game';
import { socket, joinRoom, startGame } from './services/socket';
// 由于TestControls未被使用且找不到对应模块，暂时注释掉这行导入
// import { TestControls } from './utils/testUtils';
// 从types文件导入类型定义
// 从types文件导入类型定义，确保类型已在types文件中正确导出
import type { Room, GameState } from './types';

// 头像选项
const avatarOptions = ['👨', '👩', '🤠', '👸', '🤴', '🎰', '♠️', '♥️', '♣️', '♦️'];

// 创建主题
const theme = createTheme({
  palette: {
    primary: {
      main: '#FFD700',
    },
    secondary: {
      main: '#DC143C',
    },
    background: {
      default: '#1E1E1E',
      paper: '#2D2D2D',
    },
  },
});

// 样式组件
const StyledTextField = styled(TextField)({
  '& label': {
    color: '#FFD700',
  },
  '& .MuiOutlinedInput-root': {
    color: '#FFFFFF',
    '& fieldset': {
      borderColor: '#FFD700',
    },
    '&:hover fieldset': {
      borderColor: '#FFA500',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#FFD700',
    },
  },
  '& input': {
    color: '#FFFFFF',
  },
});

// 添加游戏设置类型
interface GameSettings {
  smallBlind: number;
  bigBlind: number;
  initialChips: number;
  maxPlayers: number;
  gameTime: number;  // 单位：分钟
  turnTime: number;  // 单位：秒
}

// 主应用组件，包含自动加入房间的逻辑
// 主应用组件，包含自动加入房间的逻辑
// 添加 JSX 的类型定义
import { JSX } from 'react';

function App(): JSX.Element {
  const [tab, setTab] = useState(0);
  const [roomId, setRoomId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [selectedAvatar, setSelectedAvatar] = useState('👨');
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [gameState, setGameState] = useState<any>(null);
  const [waitingPlayers, setWaitingPlayers] = useState<any[]>([]);
  const [settings, setSettings] = useState<GameSettings>({
    smallBlind: 10,
    bigBlind: 20,
    initialChips: 1000,
    maxPlayers: 6,
    gameTime: 30,
    turnTime: 30
  });

  // 添加自动加入逻辑
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const autoJoin = params.get('autoJoin');
    const autoPlayerName = params.get('playerName');
    const autoAvatar = params.get('avatar');

    if (autoJoin && autoPlayerName && autoAvatar) {
      setPlayerName(autoPlayerName);
      setSelectedAvatar(autoAvatar);
      
      if (autoPlayerName === '玩家1') {
        handleCreateRoom();
      } else if (roomId) {
        handleJoinRoom();
      }
    }
  }, [roomId]);

  // 添加 socket 事件监听
  React.useEffect(() => {
    socket.on('playerJoined', (players) => {
      setWaitingPlayers(players);
    });

    socket.on('gameStarted', () => {
      setGameStarted(true);
    });

    return () => {
      socket.off('playerJoined');
      socket.off('gameStarted');
    };
  }, []);

  // 删除这个重复的 useEffect
  // useEffect(() => {
  //   const params = new URLSearchParams(window.location.search);
  //   const autoJoin = params.get('autoJoin');
  //   const autoPlayerName = params.get('playerName');
  //   const autoAvatar = params.get('avatar');
  
  //   if (autoJoin && autoPlayerName && autoAvatar) {
  //     setPlayerName(autoPlayerName);
  //     setSelectedAvatar(autoAvatar);
  //     
  //     if (autoPlayerName === '玩家1') {
  //       handleCreateRoom();
  //     } else if (roomId) {
  //       handleJoinRoom();
  //     }
  //   }
  // }, [roomId, handleCreateRoom, handleJoinRoom]);
  
  const handleCreateRoom = React.useCallback(async () => {
    if (!playerName) {
      alert('请输入您的名字');
      return;
    }
    
    try {
      const response = await new Promise((resolve, reject) => {
        socket.emit('createRoom', settings, (response: { id: string } | null) => {
          if (response && response.id) {
            resolve(response);
          } else {
            reject(new Error('创建房间失败'));
          }
        });
      });
      
      console.log('Room created:', response);
      setRoomId((response as { id: string }).id);
      
      // 自动加入创建的房间
      await joinRoom({ 
        roomId: (response as { id: string }).id, 
        playerName, 
        avatar: selectedAvatar 
      });
    } catch (error: any) {
      console.error('Create room error:', error);
      alert(error.message || '创建房间失败，请重试');
    }
  }, [playerName, settings, selectedAvatar]);

  const handleJoinRoom = React.useCallback(async () => {
    if (!playerName || !roomId) {
      alert('请输入您的名字和房间号');
      return;
    }

    try {
      await joinRoom({ roomId, playerName, avatar: selectedAvatar });
    } catch (error: any) {
      console.error('Join room error:', error);
      alert(error.message || '加入房间失败，请重试');
    }
  }, [playerName, roomId, selectedAvatar]);

  // Move useEffect after function declarations
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const autoJoin = params.get('autoJoin');
    const autoPlayerName = params.get('playerName');
    const autoAvatar = params.get('avatar');

    if (autoJoin && autoPlayerName && autoAvatar) {
      setPlayerName(autoPlayerName);
      setSelectedAvatar(autoAvatar);
      
      if (autoPlayerName === '玩家1') {
        handleCreateRoom();
      } else if (roomId) {
        handleJoinRoom();
      }
    }
  }, [roomId, handleCreateRoom, handleJoinRoom]);

  // 修改渲染逻辑，根据是否在房间显示不同内容
  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="sm" sx={{ 
        py: 4,
        backgroundColor: '#1E1E1E',
        minHeight: '100vh',
        boxShadow: '0 0 50px rgba(0,0,0,0.5)'
      }}>
        <Paper sx={{
          p: 4,
          background: 'linear-gradient(145deg, #2d2d2d, #232323)',
          border: '2px solid #FFD700',
          borderRadius: '20px',
          boxShadow: '0 0 30px rgba(255,215,0,0.1)'
        }}>
          <Typography variant="h3" align="center" sx={{ 
            color: '#FFD700',
            mb: 4,
            fontFamily: "'Playfair Display', serif",
            textShadow: '0 0 20px rgba(255,215,0,0.3)'
          }}>
            拉斯维加斯德州扑克
          </Typography>

          <Tabs 
            value={tab} 
            onChange={(_, newValue) => setTab(newValue)}
            centered
            sx={{
              mb: 4,
              '& .MuiTab-root': {
                color: '#FFD700',
                fontSize: '1.1rem',
                fontWeight: 'bold',
              },
              '& .Mui-selected': {
                color: '#FFA500 !important',
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#FFD700',
              },
            }}
          >
            <Tab label="创建房间" />
            <Tab label="加入房间" />
          </Tabs>

          <Box sx={{ mb: 3 }}>
            <StyledTextField
              label="您的名字"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              fullWidth
              sx={{ mb: 3 }}
            />
            
            <Typography sx={{ 
              color: '#FFD700',
              mb: 1,
              fontSize: '1.1rem',
              fontWeight: 'bold'
            }}>
              选择头像
            </Typography>
            <Box sx={{ 
              display: 'flex',
              gap: 2,
              mb: 3,
              flexWrap: 'wrap',
              p: 2,
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '10px'
            }}>
              {avatarOptions.map((avatar) => (
                <Avatar
                  key={avatar}
                  sx={{
                    cursor: 'pointer',
                    width: 50,
                    height: 50,
                    fontSize: '2rem',
                    background: selectedAvatar === avatar ? 'linear-gradient(145deg, #FFD700, #FFA500)' : 'linear-gradient(145deg, #3a3a3a, #2a2a2a)',
                    border: selectedAvatar === avatar ? '3px solid #FFD700' : '2px solid #666',
                    boxShadow: selectedAvatar === avatar ? '0 0 15px rgba(255,215,0,0.5)' : 'none',
                    '&:hover': {
                      transform: 'scale(1.1)',
                      transition: 'all 0.3s ease'
                    }
                  }}
                  onClick={() => setSelectedAvatar(avatar)}
                >
                  {avatar}
                </Avatar>
              ))}
            </Box>
          </Box>

          {tab === 0 ? (
            roomId ? (
              <Box>
                <Typography variant="h5" sx={{ color: '#FFD700', mb: 2 }}>
                  房间号: {roomId}
                </Typography>
                
                <Typography sx={{ color: 'white', mb: 2 }}>
                  {waitingPlayers.length === 1 ? '等待其他玩家加入...' : `当前玩家数: ${waitingPlayers.length}/${settings.maxPlayers}`}
                </Typography>
                
                <List sx={{ 
                  bgcolor: 'rgba(0,0,0,0.2)',
                  borderRadius: '10px',
                  mb: 3
                }}>
                  {waitingPlayers.map((player, index) => (
                    <ListItem key={index}>
                      <ListItemAvatar>
                        <Avatar sx={{ 
                          fontSize: '1.5rem',
                          background: player.isHost ? 'linear-gradient(145deg, #FFD700, #FFA500)' : 'linear-gradient(145deg, #3a3a3a, #2a2a2a)',
                          border: '2px solid #FFD700'
                        }}>
                          {player.avatar}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={
                          <Typography sx={{ color: '#FFD700' }}>
                            {player.name} {player.isHost && '👑'}
                          </Typography>
                        }
                        secondary={
                          <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            {player.isHost ? '房主' : '玩家'}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>

                {waitingPlayers.find(p => p.name === playerName)?.isHost ? (
                  <Button 
                    variant="contained"
                    fullWidth
                    onClick={() => startGame(roomId)}
                    disabled={waitingPlayers.length < 2}
                    sx={{
                      background: 'linear-gradient(145deg, #FFD700, #FFA500)',
                      color: '#000000',
                      fontSize: '1.2rem',
                      py: 1.5,
                      '&:hover': {
                        background: 'linear-gradient(145deg, #FFA500, #FFD700)',
                      },
                      '&:disabled': {
                        background: 'rgba(255,215,0,0.3)',
                        color: 'rgba(0,0,0,0.5)'
                      }
                    }}
                  >
                    开始游戏
                  </Button>
                ) : (
                  <Typography sx={{ 
                    color: '#FFD700',
                    textAlign: 'center',
                    fontSize: '1.1rem'
                  }}>
                    等待房主开始游戏...
                  </Typography>
                )}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <StyledTextField
                  label="最大玩家数"
                  type="number"
                  value={settings.maxPlayers}
                  onChange={(e) => setSettings({...settings, maxPlayers: Number(e.target.value)})}
                  inputProps={{ min: 2, max: 9 }}
                  fullWidth
                />
                <StyledTextField
                  label="游戏时长（分钟）"
                  type="number"
                  value={settings.gameTime}
                  onChange={(e) => setSettings({...settings, gameTime: Number(e.target.value)})}
                  inputProps={{ min: 10, max: 120 }}
                  fullWidth
                />
                <StyledTextField
                  label="每回合思考时间（秒）"
                  type="number"
                  value={settings.turnTime}
                  onChange={(e) => setSettings({...settings, turnTime: Number(e.target.value)})}
                  inputProps={{ min: 10, max: 60 }}
                  fullWidth
                />
                <Button 
                  variant="contained"
                  onClick={handleCreateRoom}
                  fullWidth
                  sx={{
                    background: 'linear-gradient(145deg, #FFD700, #FFA500)',
                    color: '#000000',
                    fontSize: '1.2rem',
                    py: 1.5,
                    mt: 2,
                    '&:hover': {
                      background: 'linear-gradient(145deg, #FFA500, #FFD700)',
                    }
                  }}
                >
                  创建房间
                </Button>
              </Box>
            )
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <StyledTextField
                label="房间号"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                fullWidth
              />
              <Button 
                variant="contained"
                onClick={handleJoinRoom}
                fullWidth
                sx={{
                  background: 'linear-gradient(145deg, #FFD700, #FFA500)',
                  color: '#000000',
                  fontSize: '1.2rem',
                  py: 1.5,
                  '&:hover': {
                    background: 'linear-gradient(145deg, #FFA500, #FFD700)',
                  }
                }}
              >
                加入房间
              </Button>
            </Box>
          )}
        </Paper>
      </Container>
    </ThemeProvider>
  );
}

export default App;
