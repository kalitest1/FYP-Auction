import { Server, Socket } from 'socket.io';
import { supabase } from '../config/supabase';

export const setupAuctionSockets = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`⚡ Client connected: ${socket.id}`);

    socket.on('join_room', (productId: string) => {
      socket.join(productId);
      console.log(`🏠 User ${socket.id} joined room: ${productId}`);
    });

    socket.on('place_bid', async (data: { productId: string; amount: number }) => {
      // 1. 確保產生合法的用戶代號
      const shortId = socket.id ? socket.id.substring(0, 4) : 'Guest';
      const bidderName = `User_${shortId}`;

      try {
        // 2. 嚴格查詢該商品目前的最高價
        const { data: existingBids, error: fetchError } = await supabase
          .from('bids')
          .select('amount')
          .eq('product_id', data.productId)
          .order('amount', { ascending: false })
          .limit(1);

        if (fetchError) throw fetchError;

        const currentHighest = existingBids && existingBids.length > 0 ? existingBids[0].amount : 0;

        // 3. 嚴格把關：新出價必須大於當前最高價（防止金額下降或亂跳）
        if (data.amount <= currentHighest) {
          socket.emit('bid_error', { message: `Bid must be higher than current highest ($${currentHighest})` });
          return;
        }

        // 4. 寫入 Supabase 資料庫（確保欄位名稱正確）
        const { error: insertError } = await supabase.from('bids').insert([
          {
            product_id: data.productId,
            bidder_name: bidderName,
            amount: data.amount,
          },
        ]);

        if (insertError) throw insertError;

        // 5. 組合廣播資料：明確帶上 bidderName，絕不允許為空！
        const bidData = {
          id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          bidderName: bidderName, // 確保前端接收時有這個欄位
          amount: data.amount,
          time: new Date().toLocaleTimeString(),
        };

        // 6. 廣播給房間所有人
        io.to(data.productId).emit('new_bid', bidData);
      } catch (err: any) {
        console.error('❌ Error processing bid:', err.message);
        socket.emit('bid_error', { message: 'Server error processing bid' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔥 Client disconnected: ${socket.id}`);
    });
  });
};