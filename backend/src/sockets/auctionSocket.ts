import { Server, Socket } from 'socket.io';
import { supabase } from '../config/supabase';

export const setupAuctionSockets = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`⚡ Client connected: ${socket.id}`);

    // 加入特定拍賣商品房間
    socket.on('join_room', (productId: string) => {
      socket.join(productId);
      console.log(`User ${socket.id} joined room: ${productId}`);
    });

    // 處理出價事件
    socket.on('place_bid', async (data: { productId: string; bidderName: string; amount: number }) => {
      const bidData = {
        id: Date.now().toString(),
        bidderName: data.bidderName,
        amount: data.amount,
        time: 'Just now',
      };

      // 1. 同步寫入 Supabase 資料庫
      const { error } = await supabase.from('bids').insert([
        { product_id: data.productId, bidder_name: data.bidderName, amount: data.amount }
      ]);

      if (error) {
        console.error(' Error saving bid to database:', error.message);
      }

      // 2. 廣播給房間內的所有客戶端
      io.to(data.productId).emit('new_bid', bidData);
    });

    socket.on('disconnect', () => {
      console.log(`🔥 Client disconnected: ${socket.id}`);
    });
  });
};