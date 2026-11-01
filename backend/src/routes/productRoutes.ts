import express from 'express';
import { supabase } from '../config/supabase';

const router = express.Router();

// 取得所有商品
router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('products').select('*');
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// 新增商品 (Seller 上傳)
router.post('/', async (req, res) => {
  try {
    const { title, description, price, category, image, duration } = req.body;

    const { data, error } = await supabase
      .from('products')
      .insert([
        { 
          title, 
          description, 
          price: parseFloat(price), 
          category: category || 'General', 
          image: image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
          duration: duration || 60 
        }
      ])
      .select();

    if (error) {
      console.error('❌ Supabase Insert Error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json(data[0]);
  } catch (err: any) {
    console.error('❌ Server POST Error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;