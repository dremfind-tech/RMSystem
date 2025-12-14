-- ============================================
-- SIMPLE SEED SCRIPT FOR SUPABASE SQL EDITOR
-- ============================================
-- Copy and paste this entire script into Supabase SQL Editor and run it
-- This will create dummy data for testing orders and analytics

-- Get the first restaurant ID (or use your specific restaurant ID)
DO $$
DECLARE
    v_restaurant_id UUID;
    v_user_id UUID;
    v_cat_appetizers UUID;
    v_cat_mains UUID;
    v_cat_desserts UUID;
    v_cat_beverages UUID;
    v_menu_items UUID[];
    v_order_id UUID;
    v_invoice_id UUID;
    i INTEGER;
    j INTEGER;
    v_item_id UUID;
    v_item_name TEXT;
    v_item_price NUMERIC;
    v_order_total NUMERIC;
    v_quantity INTEGER;
    v_random_date TIMESTAMP;
    v_status order_status;
BEGIN
    -- Get first restaurant
    SELECT id INTO v_restaurant_id FROM restaurants LIMIT 1;
    
    IF v_restaurant_id IS NULL THEN
        RAISE EXCEPTION 'No restaurant found. Please create a restaurant first.';
    END IF;
    
    RAISE NOTICE 'Using restaurant ID: %', v_restaurant_id;
    
    -- Get first user for this restaurant
    SELECT id INTO v_user_id FROM users WHERE restaurant_id = v_restaurant_id LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'No user found. Please create a user first.';
    END IF;
    
    RAISE NOTICE 'Using user ID: %', v_user_id;
    
    -- ============================================
    -- CREATE CATEGORIES
    -- ============================================
    
    INSERT INTO categories (restaurant_id, name, description, sort_order)
    VALUES (v_restaurant_id, 'Appetizers', 'Start your meal right', 1)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_cat_appetizers;
    
    IF v_cat_appetizers IS NULL THEN
        SELECT id INTO v_cat_appetizers FROM categories 
        WHERE restaurant_id = v_restaurant_id AND name = 'Appetizers';
    END IF;
    
    INSERT INTO categories (restaurant_id, name, description, sort_order)
    VALUES (v_restaurant_id, 'Main Courses', 'Hearty and delicious', 2)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_cat_mains;
    
    IF v_cat_mains IS NULL THEN
        SELECT id INTO v_cat_mains FROM categories 
        WHERE restaurant_id = v_restaurant_id AND name = 'Main Courses';
    END IF;
    
    INSERT INTO categories (restaurant_id, name, description, sort_order)
    VALUES (v_restaurant_id, 'Desserts', 'Sweet endings', 3)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_cat_desserts;
    
    IF v_cat_desserts IS NULL THEN
        SELECT id INTO v_cat_desserts FROM categories 
        WHERE restaurant_id = v_restaurant_id AND name = 'Desserts';
    END IF;
    
    INSERT INTO categories (restaurant_id, name, description, sort_order)
    VALUES (v_restaurant_id, 'Beverages', 'Refreshing drinks', 4)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_cat_beverages;
    
    IF v_cat_beverages IS NULL THEN
        SELECT id INTO v_cat_beverages FROM categories 
        WHERE restaurant_id = v_restaurant_id AND name = 'Beverages';
    END IF;
    
    RAISE NOTICE 'Categories created/found';
    
    -- ============================================
    -- CREATE MENU ITEMS
    -- ============================================
    
    -- Appetizers
    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_available)
    VALUES 
        (v_restaurant_id, v_cat_appetizers, 'Caesar Salad', 'Fresh romaine lettuce with parmesan', 8.99, true),
        (v_restaurant_id, v_cat_appetizers, 'French Fries', 'Crispy golden fries', 4.99, true),
        (v_restaurant_id, v_cat_appetizers, 'Chicken Wings', 'Spicy buffalo wings', 12.99, true),
        (v_restaurant_id, v_cat_appetizers, 'Mozzarella Sticks', 'Breaded and fried', 7.99, true)
    ON CONFLICT DO NOTHING;
    
    -- Main Courses
    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_available)
    VALUES 
        (v_restaurant_id, v_cat_mains, 'Classic Burger', 'Beef patty with lettuce, tomato, cheese', 14.99, true),
        (v_restaurant_id, v_cat_mains, 'Margherita Pizza', 'Fresh mozzarella and basil', 16.99, true),
        (v_restaurant_id, v_cat_mains, 'Pasta Carbonara', 'Creamy pasta with bacon', 15.99, true),
        (v_restaurant_id, v_cat_mains, 'Grilled Chicken', 'With seasonal vegetables', 18.99, true),
        (v_restaurant_id, v_cat_mains, 'Fish and Chips', 'Beer-battered cod', 17.99, true)
    ON CONFLICT DO NOTHING;
    
    -- Desserts
    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_available)
    VALUES 
        (v_restaurant_id, v_cat_desserts, 'Chocolate Cake', 'Rich and moist', 6.99, true),
        (v_restaurant_id, v_cat_desserts, 'Ice Cream Sundae', 'Three scoops with toppings', 5.99, true),
        (v_restaurant_id, v_cat_desserts, 'Tiramisu', 'Italian classic', 7.99, true),
        (v_restaurant_id, v_cat_desserts, 'Cheesecake', 'New York style', 6.99, true)
    ON CONFLICT DO NOTHING;
    
    -- Beverages
    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_available)
    VALUES 
        (v_restaurant_id, v_cat_beverages, 'Coca Cola', 'Classic soda', 2.99, true),
        (v_restaurant_id, v_cat_beverages, 'Fresh Orange Juice', 'Squeezed daily', 4.99, true),
        (v_restaurant_id, v_cat_beverages, 'Coffee', 'Freshly brewed', 3.99, true),
        (v_restaurant_id, v_cat_beverages, 'Iced Tea', 'Refreshing', 2.99, true)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Menu items created';
    
    -- ============================================
    -- CREATE 50 ORDERS
    -- ============================================
    
    FOR i IN 1..50 LOOP
        -- Random date in last 30 days
        v_random_date := NOW() - (RANDOM() * INTERVAL '30 days');
        
        -- Determine status
        IF i <= 5 THEN
            v_status := 'CREATED';
        ELSIF i <= 10 THEN
            v_status := 'ACCEPTED';
        ELSIF i <= 15 THEN
            v_status := 'COOKING';
        ELSIF i <= 20 THEN
            v_status := 'READY';
        ELSIF i <= 45 THEN
            v_status := 'SERVED';
        ELSE
            v_status := 'CANCELLED';
        END IF;
        
        -- Create order
        INSERT INTO orders (restaurant_id, table_number, waiter_id, status, total_amount, created_at, updated_at)
        VALUES (
            v_restaurant_id,
            'T-' || (FLOOR(RANDOM() * 20) + 1)::TEXT,
            v_user_id,
            v_status,
            0,
            v_random_date,
            v_random_date
        )
        RETURNING id INTO v_order_id;
        
        -- Add 2-5 random items to order
        v_order_total := 0;
        FOR j IN 1..(FLOOR(RANDOM() * 4) + 2)::INTEGER LOOP
            -- Get random menu item
            SELECT id, name, price INTO v_item_id, v_item_name, v_item_price
            FROM menu_items
            WHERE restaurant_id = v_restaurant_id
            ORDER BY RANDOM()
            LIMIT 1;
            
            v_quantity := (FLOOR(RANDOM() * 2) + 1)::INTEGER; -- 1-2 quantity
            
            -- Insert order item
            INSERT INTO order_items (order_id, menu_item_id, name, price, quantity)
            VALUES (v_order_id, v_item_id, v_item_name, v_item_price, v_quantity);
            
            v_order_total := v_order_total + (v_item_price * v_quantity);
        END LOOP;
        
        -- Update order total
        UPDATE orders SET total_amount = v_order_total WHERE id = v_order_id;
        
        -- Create invoice for SERVED orders
        IF v_status = 'SERVED' THEN
            INSERT INTO invoices (order_id, restaurant_id, subtotal, tax, total)
            VALUES (
                v_order_id,
                v_restaurant_id,
                v_order_total,
                v_order_total * 0.10,
                v_order_total * 1.10
            )
            RETURNING id INTO v_invoice_id;
            
            -- Add payment (90% chance)
            IF RANDOM() > 0.1 THEN
                INSERT INTO payments (invoice_id, amount, method)
                VALUES (
                    v_invoice_id,
                    v_order_total * 1.10,
                    CASE WHEN RANDOM() > 0.5 THEN 'CARD' ELSE 'CASH' END
                );
            END IF;
        END IF;
        
        -- Add status history
        INSERT INTO order_status_history (order_id, status, changed_by, created_at)
        VALUES (v_order_id, 'CREATED', v_user_id, v_random_date);
        
        IF i % 10 = 0 THEN
            RAISE NOTICE 'Created % orders', i;
        END IF;
    END LOOP;
    
    RAISE NOTICE '✅ Successfully created 50 orders!';
    
END $$;

-- ============================================
-- SHOW STATISTICS
-- ============================================

SELECT '📊 STATISTICS' as info;

SELECT 'Orders by Status' as metric, status, COUNT(*) as count
FROM orders
GROUP BY status
ORDER BY count DESC;

SELECT 'Total Orders' as metric, COUNT(*) as count
FROM orders;

SELECT 'Total Revenue' as metric, TO_CHAR(SUM(total), 'FM$999,999.00') as amount
FROM invoices;

SELECT 'Top 5 Selling Items' as metric, oi.name, SUM(oi.quantity) as total_sold
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE o.status = 'SERVED'
GROUP BY oi.name
ORDER BY total_sold DESC
LIMIT 5;

SELECT '✅ Seeding completed!' as status;
