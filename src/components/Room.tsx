import React, { useState } from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';

interface RoomProps {
  roomId: string;
}

const Room: React.FC<RoomProps> = ({ roomId }) => {
  const [settings, setSettings] = useState({
    smallBlind: 10,
    bigBlind: 20,
    initialChips: 1000,
    timeLimit: 30, // 房间总时限（分钟）
    turnTime: 30,  // 每回合时限（秒）
  });

  const [players, setPlayers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">房间号: {roomId}</Typography>
      
      {/* 房间设置 */}
      <Box sx={{ my: 2 }}>
        <Typography variant="h6">房间设置</Typography>
        <TextField
          label="小盲"
          type="number"
          value={settings.smallBlind}
          onChange={(e) => setSettings({...settings, smallBlind: Number(e.target.value)})}
        />
        <TextField
          label="大盲"
          type="number"
          value={settings.bigBlind}
          onChange={(e) => setSettings({...settings, bigBlind: Number(e.target.value)})}
        />
        <TextField
          label="初始筹码"
          type="number"
          value={settings.initialChips}
          onChange={(e) => setSettings({...settings, initialChips: Number(e.target.value)})}
        />
        <TextField
          label="房间时限（分钟）"
          type="number"
          value={settings.timeLimit}
          onChange={(e) => setSettings({...settings, timeLimit: Number(e.target.value)})}
        />
        <TextField
          label="回合时限（秒）"
          type="number"
          value={settings.turnTime}
          onChange={(e) => setSettings({...settings, turnTime: Number(e.target.value)})}
        />
      </Box>

      {/* 积分榜 */}
      <Box sx={{ my: 2 }}>
        <Typography variant="h6">积分榜</Typography>
        {leaderboard.map((player: any, index) => (
          <Box key={index}>
            <Typography>{player.name}: {player.score}</Typography>
          </Box>
        ))}
      </Box>

      {/* 邀请按钮 */}
      <Button 
        variant="contained" 
        onClick={() => {
          // 复制邀请链接到剪贴板
          navigator.clipboard.writeText(`${window.location.origin}/join/${roomId}`);
        }}
      >
        复制邀请链接
      </Button>
    </Box>
  );
};

export default Room;