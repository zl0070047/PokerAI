import { Server } from 'socket.io';
import { createServer } from 'http';
// 创建 HTTP 服务器实例
const httpServer = createServer();

// 检查后端 CORS 配置是否类似这样：
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});