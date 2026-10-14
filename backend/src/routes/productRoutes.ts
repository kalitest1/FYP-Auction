import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

// 1. 取得所有拍賣商品
router.get('/', async (req: Request, res: Response) => {
  const { data, error } = await supabase.from('products').select('*');
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  return res.json(data);
});

// 2. 新增拍賣商品 (賣家功能)
router.post('/', async (req: Request, res: Response) => {
  const { title, description, price, category, image } = req.body;
  const { data, error } = await supabase
    .from('products')
    .insert([{ title, description, price, category, image }])
    .select();

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  return res.status(201).json(data[0]);
});

export default router;