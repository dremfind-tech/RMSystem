import { Request, Response } from 'express';
import { supabaseAdmin } from '../utils/supabase';

// 1. GET /api/analytics/dashboard
export const getAnalyticsDashboard = async (req: Request, res: Response) => {
    const { from, to } = req.query;

    const startDate = from ? new Date(from as string).toISOString() : new Date(new Date().setDate(new Date().getDate() - 7)).toISOString();
    const endDate = to ? new Date(to as string).toISOString() : new Date().toISOString();

    // 1. Total Revenue (Sum of COMPLETED/SERVED orders)
    // Note: Supabase JS library doesn't support .sum() directly on query builder easily without RPC, 
    // but we can fetch data and sum in serverless function if volume is low, OR use .select('total_amount')
    // Ideally use RPC for heavy analytics, but for now:

    // Fetch SERVED orders in range
    const { data: orders, error: ordersError } = await supabaseAdmin
        .from('orders')
        .select('total_amount, created_at')
        .eq('status', 'SERVED') // Assuming SERVED is the completed status
        .gte('created_at', startDate)
        .lte('created_at', endDate);

    if (ordersError) {
        console.error('Analytics Error (Orders):', ordersError);
        return res.status(500).json({ error: ordersError.message });
    }

    const totalRevenue = orders?.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0) || 0;
    const totalOrders = orders?.length || 0;

    // 2. Top Items (Most ordered)
    // We need to join order_items -> orders to filter by date/status, 
    // OR just simple count from order_items if we assume all created items count (or filter by order_id.status later).
    // Let's do a simple fetch of order_items created in range.
    const { data: items, error: itemsError } = await supabaseAdmin
        .from('order_items')
        .select(`
            name,
            quantity,
            price
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

    if (itemsError) {
        console.error('Analytics Error (Items):', itemsError);
        return res.status(500).json({ error: itemsError.message });
    }

    // Aggregation in memory (Serverless Node.js)
    const itemMap = new Map<string, { count: number, revenue: number }>();

    items?.forEach(item => {
        const current = itemMap.get(item.name) || { count: 0, revenue: 0 };
        current.count += item.quantity;
        current.revenue += item.quantity * Number(item.price);
        itemMap.set(item.name, current);
    });

    const topItems = Array.from(itemMap.entries())
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5

    res.json({
        period: { from: startDate, to: endDate },
        summary: {
            revenue: totalRevenue,
            orders: totalOrders, // Only SERVED orders
        },
        topItems
    });
};
