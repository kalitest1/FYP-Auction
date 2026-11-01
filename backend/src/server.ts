import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import productRoutes from './routes/productRoutes';
import { setupAuctionSockets } from './sockets/auctionSocket';
import bidRoutes from './routes/bidRoutes';
// 1. 如果你在 server.ts 處理刪除，需要導入 supabase 客戶端（或確認你是否有在其他路由檔處理）
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// 初始化 Supabase 客戶端（若尚未在其他檔案定義）
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 初始化 Socket.io 並允許跨域連線
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'DELETE'], // 🌟 建議順便把 DELETE 方法加入 CORS 允許清單
  },
});

app.use(cors());
app.use(express.json());

// 註冊 API 路由
app.use('/api/products', productRoutes);
app.use('/api/bids', bidRoutes);

// 🌟 2. 增加刪除商品的 API 路由（如果你的專案是把路由統一寫在這裡）
// 刪除商品的 API 路由
app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 從 Supabase 的 products 資料表中刪除該筆商品
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting product:', error.message);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// 設定 Socket 實時事件
setupAuctionSockets(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Backend Server running on http://localhost:${PORT}`);
});