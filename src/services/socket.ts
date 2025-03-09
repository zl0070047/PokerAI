import { io } from 'socket.io-client';
import { GameSettings, Room, GameState } from '../types';

const socket = io('http://localhost:3001', {
  transports: ['websocket'],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,  // 添加重连延迟
  timeout: 10000  // 增加超时时间
});

socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});

export const createRoom = (settings: GameSettings): Promise<Room> => {
  return new Promise((resolve, reject) => {
    socket.emit('createRoom', settings, (response: any) => {
      if (response.error) {
        reject(response.error);
      } else {
        resolve(response);
      }
    });
  });
};

export const joinRoom = (data: { roomId: string; playerName: string; avatar: string }): Promise<Room> => {
  return new Promise((resolve, reject) => {
    socket.emit('joinRoom', data, (response: any) => {
      if (response.error) {
        reject(response.error);
      } else {
        resolve(response);
      }
    });
  });
};

export const startGame = (roomId: string): Promise<GameState> => {
  return new Promise((resolve, reject) => {
    socket.emit('startGame', { roomId }, (response: any) => {
      if (response.error) {
        reject(response.error);
      } else {
        resolve(response);
      }
    });
  });
};

export { socket };