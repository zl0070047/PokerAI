import { io } from 'socket.io-client';

export const socketConfig = {
  url: process.env.REACT_APP_WS_URL || 'http://localhost:3001',
  options: {
    transports: ['websocket'],
    reconnection: true
  }
};

export const createSocket = () => {
  return io(socketConfig.url, socketConfig.options);
};