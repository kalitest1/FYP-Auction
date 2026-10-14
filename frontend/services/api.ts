import axios from 'axios';

// 自動讀取 .env 中的網址
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://auction-backend-vgus.onrender.com';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});