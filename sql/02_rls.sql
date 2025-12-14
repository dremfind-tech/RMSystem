-- Enable Row Level Security
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
BEGIN
  RETURN (SELECT role FROM user_roles WHERE user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. USERS: Admin triggers (managed via backend usually, but for reading)
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- 2. USER ROLES:
CREATE POLICY "Users can view their own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage roles" ON user_roles
  FOR ALL USING (get_my_role() = 'ADMIN');

-- 3. MENU (Categories & Items)
-- Everyone (Authenticated) can view menu
CREATE POLICY "Authenticated users can view categories" ON categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view menu items" ON menu_items
  FOR SELECT TO authenticated USING (true);

-- ADMIN can manage menu
CREATE POLICY "Admin can manage categories" ON categories
  FOR ALL USING (get_my_role() = 'ADMIN');

CREATE POLICY "Admin can manage menu items" ON menu_items
  FOR ALL USING (get_my_role() = 'ADMIN');

-- 4. ORDERS
-- WAITER: Create orders, View own orders (or all? Req: "View own orders")
CREATE POLICY "Waiters can create orders" ON orders
  FOR INSERT WITH CHECK (get_my_role() = 'WAITER');

CREATE POLICY "Waiters can view own orders" ON orders
  FOR SELECT USING (get_my_role() = 'WAITER' AND waiter_id = auth.uid());

-- CHEF: View all orders (usually those in Kitchen status, but let's allow all for simplicity or filter later)
CREATE POLICY "Chefs can view orders" ON orders
  FOR SELECT USING (get_my_role() = 'CHEF');

-- CASHIER: View all orders
CREATE POLICY "Cashiers can view orders" ON orders
  FOR SELECT USING (get_my_role() = 'CASHIER');

-- ADMIN: Access everything
CREATE POLICY "Admin can access orders" ON orders
  FOR ALL USING (get_my_role() = 'ADMIN');

-- SHARED Update Policy for Chef/Waiter transitions? 
-- "Chef can update order status". "Waiter creates order".
CREATE POLICY "Chef can update orders" ON orders
  FOR UPDATE USING (get_my_role() = 'CHEF');

-- 5. ORDER ITEMS
-- Inherit access from orders roughly, but standard approach:
CREATE POLICY "Read order items if can read order" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id)
  ); 
-- Note: Subqueries in RLS can be expensive. Since policies on 'orders' limit visibility, 
-- we can often just allow Authenticated Read on items if IDs are secret, 
-- but let's try to be strict. A simpler way for this demo:
CREATE POLICY "Authenticated can read order items" ON order_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Waiters can add items" ON order_items
  FOR INSERT WITH CHECK (get_my_role() = 'WAITER');

-- 6. ORDER STATUS HISTORY
CREATE POLICY "Authenticated can read history" ON order_status_history
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "System/Users can insert history" ON order_status_history
  FOR INSERT TO authenticated WITH CHECK (true); -- Backend usually handles this

-- 7. INVOICES
-- CASHIER: View invoices
CREATE POLICY "Cashiers can view invoices" ON invoices
  FOR SELECT USING (get_my_role() = 'CASHIER');

CREATE POLICY "Admin can view invoices" ON invoices
  FOR SELECT USING (get_my_role() = 'ADMIN');

-- (Billing trigger is backend/server-side, which uses Service Role usually, bypassing RLS. 
-- But if RLS is enforced, insert needs permission)
CREATE POLICY "Service Role or Admin can manage invoices" ON invoices
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role' OR get_my_role() = 'ADMIN');
-- Note: This `auth.jwt()` check might depend on how the backend connects.
-- If backend uses `service_role` key, RLS is bypassed by default in Supabase client unless configured otherwise.
-- We will assume Backend = Service Role for Invoice Generation.

