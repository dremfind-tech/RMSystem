import { Request, Response } from 'express';
import { supabaseAdmin } from '../utils/supabase';

// 1. GET /api/menu (Public or Authenticated? "WAITER can Read menu". Let's make it Authenticated per RLS sections, but public logic often applies. Following requirements.)
export const getMenu = async (req: Request, res: Response) => {
    // Fetch Categories with their Items
    const { data: categories, error } = await supabaseAdmin
        .from('categories')
        .select(`
      *,
      menu_items (*)
    `)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

    // Note: menu_items default sort might be needed.

    if (error) return res.status(500).json({ error: error.message });
    res.json(categories);
};

// 2. POST /api/menu/category (ADMIN)
export const createCategory = async (req: Request, res: Response) => {
    let { name, description, restaurant_id } = req.body;

    // If restaurant_id is not provided, fetch it from the logged-in user
    if (!restaurant_id && req.user && req.user.sub) {
        const { data: userData, error: userError } = await supabaseAdmin
            .from('users') // Assuming 'users' table links auth.users to restaurant
            .select('restaurant_id')
            .eq('id', req.user.sub)
            .single();

        if (userError || !userData?.restaurant_id) {
            console.error('Failed to resolve restaurant_id for user:', req.user.sub, userError);
            return res.status(400).json({ error: 'Could not determine restaurant_id for user' });
        }
        restaurant_id = userData.restaurant_id;
    }

    const { data, error } = await supabaseAdmin
        .from('categories')
        .insert([{ name, description, restaurant_id }])
        .select()
        .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
};

// 3. POST /api/menu/item (ADMIN)
export const createMenuItem = async (req: Request, res: Response) => {
    let { restaurant_id, category_id, name, description, price, image_url } = req.body;

    // If restaurant_id is not provided, fetch it from the logged-in user
    if (!restaurant_id && req.user && req.user.sub) {
        const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('restaurant_id')
            .eq('id', req.user.sub)
            .single();

        if (userError || !userData?.restaurant_id) {
            console.error('CreateItem: Failed to resolve restaurant_id for user:', req.user.sub, userError);
            return res.status(400).json({ error: 'Could not determine restaurant_id for user' });
        }
        restaurant_id = userData.restaurant_id;
        console.log('CreateItem: Resolved restaurant_id:', restaurant_id);
    }

    console.log('CreateItem: Input Data:', { restaurant_id, category_id, name });

    const isUUID = (str: any) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    if (!restaurant_id || !isUUID(restaurant_id)) {
        return res.status(400).json({ error: `Invalid or missing restaurant_id: ${restaurant_id}` });
    }
    if (!category_id || !isUUID(category_id)) {
        return res.status(400).json({ error: `Invalid or missing category_id: ${category_id}` });
    }


    const { data, error } = await supabaseAdmin
        .from('menu_items')
        .insert([{ restaurant_id, category_id, name, description, price, image_url }])
        .select()
        .single();

    if (error) {
        console.error('CreateItem: DB Insert Error:', error);
        return res.status(400).json({ error: error.message });
    }
    res.status(201).json(data);
};

// 4. PUT /api/menu/item/:id (ADMIN)
export const updateMenuItem = async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabaseAdmin
        .from('menu_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
};

// 5. DELETE /api/menu/item/:id (ADMIN)
export const deleteMenuItem = async (req: Request, res: Response) => {
    const { id } = req.params;

    const { error } = await supabaseAdmin
        .from('menu_items')
        .delete()
        .eq('id', id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Item deleted' });
};

// 6. PUT /api/menu/category/:id (ADMIN)
export const updateCategory = async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body; // { name, sort_order }

    const { data, error } = await supabaseAdmin
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
};

// 7. DELETE /api/menu/category/:id (ADMIN)
export const deleteCategory = async (req: Request, res: Response) => {
    const { id } = req.params;

    // Check for dependent items? Optional, but DB might have constraints or cascading.
    // Assuming DB handles cascade or error.
    const { error } = await supabaseAdmin
        .from('categories')
        .delete()
        .eq('id', id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Category deleted' });
};
