import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// 🔍 自我檢查：如果環境變數是空的，直接在終端機報錯提示
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: SUPABASE_URL or SUPABASE_ANON_KEY is missing in .env file!');
} else {
  console.log('✅ Supabase initialized successfully with URL:', supabaseUrl);
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);