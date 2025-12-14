import { Request, Response } from 'express';
import { supabaseAdmin } from '../utils/supabase';

// GET /api/invoices/:orderId
export const getInvoiceByOrderId = async (req: Request, res: Response) => {
    const { orderId } = req.params;

    const { data, error } = await supabaseAdmin
        .from('invoices')
        .select(`
      *,
      order:orders (
        *,
        order_items (*)
      )
    `)
        .eq('order_id', orderId)
        .single();

    if (error) return res.status(404).json({ error: 'Invoice not found' });
    res.json(data);
};
