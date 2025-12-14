import { Request, Response } from 'express';
import { supabaseAdmin } from '../utils/supabase';

// 1. GET /api/analytics/dashboard
export const getAnalyticsDashboard = async (req: Request, res: Response) => {
    const { from, to, period } = req.query;

    let startDate: string;
    let endDate: string = to ? new Date(to as string).toISOString() : new Date().toISOString();

    // Support for 'all' period to get all-time analytics
    if (period === 'all') {
        startDate = '1970-01-01T00:00:00.000Z'; // Beginning of time (Unix epoch)
    } else if (from) {
        startDate = new Date(from as string).toISOString();
    } else {
        // Default to last 7 days
        startDate = new Date(new Date().setDate(new Date().getDate() - 7)).toISOString();
    }

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

    // 3. Generate daily sales data for time-series charts
    const salesByDate = new Map<string, { revenue: number, orders: number }>();

    orders?.forEach(order => {
        // Extract date in YYYY-MM-DD format
        const dateStr = order.created_at.split('T')[0];
        const current = salesByDate.get(dateStr) || { revenue: 0, orders: 0 };
        current.revenue += Number(order.total_amount) || 0;
        current.orders += 1;
        salesByDate.set(dateStr, current);
    });

    // Convert to array and sort by date
    const salesData = Array.from(salesByDate.entries())
        .map(([date, data]) => ({
            date,
            revenue: data.revenue,
            orders: data.orders
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

    // 4. Calculate average order value
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    res.json({
        period: { from: startDate, to: endDate },
        stats: {
            total_revenue: totalRevenue,
            total_orders: totalOrders,
            average_order_value: averageOrderValue
        },
        sales_data: salesData,
        topItems
    });
};
