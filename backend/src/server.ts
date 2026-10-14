import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import productRoutes from './routes/productRoutes';
import { setupAuctionSockets } from './sockets/auctionSocket';
import bidRoutes from './routes/bidRoutes';

dotenv.config();

const app = express();
const server = http.createServer(app);

// 初始化 Socket.io 並允許跨域連線
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// 註冊 API 路由
app.use('/api/products', productRoutes);
app.use('/api/bids', bidRoutes);

// 設定 Socket 實時事件
setupAuctionSockets(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Backend Server running on http://localhost:${PORT}`);
});