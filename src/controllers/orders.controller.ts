import { Request, Response } from 'express';
import { supabaseAdmin } from '../utils/supabase';

// State Machine Validations
const VALID_TRANSITIONS: Record<string, string[]> = {
    'CREATED': ['ACCEPTED', 'CANCELLED'],
    'ACCEPTED': ['COOKING', 'CANCELLED'],
    'COOKING': ['READY', 'CANCELLED'], // Chef moves to READY
    'READY': ['SERVED', 'CANCELLED'],  // Waiter serves
    'SERVED': [], // Terminal
    'CANCELLED': [] // Terminal
};

// 1. POST /api/orders (WAITER)
export const createOrder = async (req: Request, res: Response) => {
    const { restaurant_id, table_number, items } = req.body; // items: { menu_item_id, quantity, notes }[]
    const waiter_id = req.user.sub;

    if (!items || items.length === 0) {
        return res.status(400).json({ error: 'Order must contain items' });
    }

    // Transaction-like logic (No strict SQL transaction here unless using RPC, 
    // but we will do best effort or sequential checks)

    // 1. Calculate prices from DB to ensure validity
    const itemIds = items.map((i: any) => i.menu_item_id);
    const { data: menuItems, error: menuError } = await supabaseAdmin
        .from('menu_items')
        .select('id, price, name')
        .in('id', itemIds);

    if (menuError || !menuItems) return res.status(500).json({ error: 'Error fetching menu prices' });

    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of items) {
        const menuItem = (menuItems as any[]).find((m: any) => m.id === item.menu_item_id);
        if (!menuItem) return res.status(400).json({ error: `Invalid item id: ${item.menu_item_id}` });

        const count = item.quantity || 1;
        const itemTotal = menuItem.price * count;
        totalAmount += itemTotal;

        orderItemsData.push({
            menu_item_id: menuItem.id,
            name: menuItem.name,
            price: menuItem.price,
            quantity: count,
            notes: item.notes
        });
    }

    // 2. Create Order
    const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert([{
            restaurant_id,
            table_number,
            waiter_id,
            status: 'CREATED',
            total_amount: totalAmount
        }])
        .select()
        .single();

    if (orderError) return res.status(500).json({ error: orderError.message });

    // 3. Insert Order Items
    const itemsToInsert = orderItemsData.map(i => ({ ...i, order_id: order.id }));
    const { error: itemsError } = await supabaseAdmin
        .from('order_items')
        .insert(itemsToInsert);

    if (itemsError) {
        // Ideally rollback order here
        await supabaseAdmin.from('orders').delete().eq('id', order.id);
        return res.status(500).json({ error: itemsError.message });
    }

    // 4. Log History
    await supabaseAdmin.from('order_status_history').insert([{
        order_id: order.id,
        status: 'CREATED',
        changed_by: waiter_id
    }]);

    res.status(201).json({ order, items: itemsToInsert });
};

// 2. GET /api/orders
export const getOrders = async (req: Request, res: Response) => {
    const role = req.userRole;


    let query = supabaseAdmin
        .from('orders')
        .select(`
      *,
      order_items (*)
    `)
        .order('created_at', { ascending: false });

    // Filter based on role if strictly needed by API (RLS does it for DB direct access, 
    // but here we are using Admin client, so we must filter manually if we want to restrict API)
    if (req.userRole === 'WAITER') {
        query = query.eq('waiter_id', req.user.sub);
    }
    // CHEF, CASHIER, ADMIN see all.

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
};

// 3. GET /api/orders/:id
export const getOrderById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
        .from('orders')
        .select(`*, order_items(*)`)
        .eq('id', id)
        .single();

    if (error) return res.status(404).json({ error: 'Order not found' });
    res.json(data);
};

// 4. PUT /api/orders/:id/status (CHEF, WAITER, ADMIN)
export const updateOrderStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.sub;
    const userRole = req.userRole;

    // 1. Fetch current status
    const { data: currentOrder, error: fetchError } = await supabaseAdmin
        .from('orders')
        .select('status, restaurant_id, total_amount')
        .eq('id', id)
        .single();

    if (fetchError || !currentOrder) return res.status(404).json({ error: 'Order not found' });

    // 2. Validate Transition
    const allowedTransitions = VALID_TRANSITIONS[currentOrder.status];
    if (!allowedTransitions || !allowedTransitions.includes(status)) {
        return res.status(400).json({
            error: `Invalid status transition from ${currentOrder.status} to ${status}`
        });
    }

    // 3. Role Validation for specific transitions (Optional business logic)
    // e.g., Only Chef: CREATED -> COOKING -> READY?
    // e.g., Only Waiter: READY -> SERVED?
    if (userRole === 'CHEF' && !['ACCEPTED', 'COOKING', 'READY'].includes(status)) {
        // Chef usually manages cooking flow
    }

    // 4. Update Status
    const { error: updateError } = await supabaseAdmin
        .from('orders')
        .update({ status })
        .eq('id', id);

    if (updateError) return res.status(500).json({ error: updateError.message });

    // 5. Log History
    await supabaseAdmin.from('order_status_history').insert([{
        order_id: id,
        status: status,
        changed_by: userId
    }]);

    // 6. Billing Trigger -> If SERVED
    if (status === 'SERVED') {
        // Check if invoice exists
        const { data: existing } = await supabaseAdmin
            .from('invoices')
            .select('id')
            .eq('order_id', id)
            .single();

        if (!existing) {
            const taxRate = 0.10; // 10% tax example
            const subtotal = currentOrder.total_amount;
            const tax = subtotal * taxRate;
            const total = subtotal + tax;

            await supabaseAdmin.from('invoices').insert([{
                order_id: id,
                restaurant_id: currentOrder.restaurant_id,
                subtotal,
                tax,
                total
            }]);
        }
    }

    res.json({ message: 'Order status updated', newStatus: status });
};
