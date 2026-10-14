import { io } from 'socket.io-client';

// 如果在真机测试，请将 localhost 改为电脑的局域网 IP (例如 http://192.168.1.x:3000)
export const socket = io('http://localhost:3000', {
  autoConnect: true,
});