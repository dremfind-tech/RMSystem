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
    const { name, description, restaurant_id } = req.body;
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
    const { restaurant_id, category_id, name, description, price, image_url } = req.body;

    const { data, error } = await supabaseAdmin
        .from('menu_items')
        .insert([{ restaurant_id, category_id, name, description, price, image_url }])
        .select()
        .single();

    if (error) return res.status(400).json({ error: error.message });
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
