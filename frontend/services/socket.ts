import { io } from 'socket.io-client';

// 已更換為部署在 Render 的雲端後端網址
export const socket = io('https://auction-backend-vgus.onrender.com', {
  autoConnect: true,
  transports: ['websocket'], // 建議加上此項，可加快在雲端環境下的連线速度與穩定度
});