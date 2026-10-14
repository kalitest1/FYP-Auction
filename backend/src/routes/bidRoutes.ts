import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

// 1. 取得指定商品的出價歷史紀錄
router.get('/:productId', async (req: Request, res: Response) => {
  const { productId } = req.params;

  const { data, error } = await supabase
    .from('bids')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json(data);
});

// 2. 透過 REST API 新增出價紀錄 (備用 API 出價管道)
router.post('/', async (req: Request, res: Response) => {
  const { productId, bidderName, amount } = req.body;

  if (!productId || !bidderName || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { data, error } = await supabase
    .from('bids')
    .insert([
      {
        product_id: productId,
        bidder_name: bidderName,
        amount: amount,
      },
    ])
    .select();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).json(data[0]);
});

export default router;