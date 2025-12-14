-- Seed Data for Testing Orders and Analytics
-- This script creates realistic dummy data for a restaurant management system

-- Note: Replace the UUIDs below with actual UUIDs from your existing data
-- You can get these by running: SELECT id, name FROM restaurants; SELECT id, email FROM users;

-- Variables (Replace these with your actual IDs)
-- For this script to work, you need to have at least:
-- 1. One restaurant
-- 2. One admin user
-- 3. One or more categories
-- 4. One or more menu items

-- ============================================
-- STEP 1: Insert Sample Menu Items (if needed)
-- ============================================

-- First, let's get or create a restaurant
DO $$
DECLARE
    v_restaurant_id UUID;
    v_admin_user_id UUID;
    v_waiter_user_id UUID;
    v_chef_user_id UUID;
    v_category_appetizers UUID;
    v_category_mains UUID;
    v_category_desserts UUID;
    v_category_beverages UUID;
    v_item_burger UUID;
    v_item_pizza UUID;
    v_item_pasta UUID;
    v_item_salad UUID;
    v_item_fries UUID;
    v_item_cake UUID;
    v_item_icecream UUID;
    v_item_soda UUID;
    v_item_coffee UUID;
    v_order_id UUID;
    v_invoice_id UUID;
    i INTEGER;
BEGIN
    -- Get existing restaurant or create one
    SELECT id INTO v_restaurant_id FROM restaurants LIMIT 1;
    
    IF v_restaurant_id IS NULL THEN
        INSERT INTO restaurants (name, address, phone)
        VALUES ('Test Restaurant', '123 Main St, City', '+1234567890')
        RETURNING id INTO v_restaurant_id;
        
        RAISE NOTICE 'Created restaurant with ID: %', v_restaurant_id;
    ELSE
        RAISE NOTICE 'Using existing restaurant with ID: %', v_restaurant_id;
    END IF;

    -- Get existing users or note that they need to be created
    SELECT id INTO v_admin_user_id FROM users WHERE restaurant_id = v_restaurant_id LIMIT 1;
    
    IF v_admin_user_id IS NULL THEN
        RAISE NOTICE 'No users found. Please create users through Supabase Auth first.';
        RAISE NOTICE 'Restaurant ID to use: %', v_restaurant_id;
        RETURN;
    END IF;

    -- Try to get different role users
    SELECT u.id INTO v_waiter_user_id 
    FROM users u 
    JOIN user_roles ur ON u.id = ur.user_id 
    WHERE ur.role = 'WAITER' AND u.restaurant_id = v_restaurant_id 
    LIMIT 1;
    
    IF v_waiter_user_id IS NULL THEN
        v_waiter_user_id := v_admin_user_id; -- Fallback to admin
    END IF;

    SELECT u.id INTO v_chef_user_id 
    FROM users u 
    JOIN user_roles ur ON u.id = ur.user_id 
    WHERE ur.role = 'CHEF' AND u.restaurant_id = v_restaurant_id 
    LIMIT 1;
    
    IF v_chef_user_id IS NULL THEN
        v_chef_user_id := v_admin_user_id; -- Fallback to admin
    END IF;

    -- ============================================
    -- Create Categories
    -- ============================================
    
    -- Check if categories exist
    SELECT id INTO v_category_appetizers FROM categories WHERE restaurant_id = v_restaurant_id AND name = 'Appetizers';
    IF v_category_appetizers IS NULL THEN
        INSERT INTO categories (restaurant_id, name, description, sort_order)
        VALUES (v_restaurant_id, 'Appetizers', 'Start your meal right', 1)
        RETURNING id INTO v_category_appetizers;
    END IF;

    SELECT id INTO v_category_mains FROM categories WHERE restaurant_id = v_restaurant_id AND name = 'Main Courses';
    IF v_category_mains IS NULL THEN
        INSERT INTO categories (restaurant_id, name, description, sort_order)
        VALUES (v_restaurant_id, 'Main Courses', 'Hearty and delicious', 2)
        RETURNING id INTO v_category_mains;
    END IF;

    SELECT id INTO v_category_desserts FROM categories WHERE restaurant_id = v_restaurant_id AND name = 'Desserts';
    IF v_category_desserts IS NULL THEN
        INSERT INTO categories (restaurant_id, name, description, sort_order)
        VALUES (v_restaurant_id, 'Desserts', 'Sweet endings', 3)
        RETURNING id INTO v_category_desserts;
    END IF;

    SELECT id INTO v_category_beverages FROM categories WHERE restaurant_id = v_restaurant_id AND name = 'Beverages';
    IF v_category_beverages IS NULL THEN
        INSERT INTO categories (restaurant_id, name, description, sort_order)
        VALUES (v_restaurant_id, 'Beverages', 'Refreshing drinks', 4)
        RETURNING id INTO v_category_beverages;
    END IF;

    -- ============================================
    -- Create Menu Items
    -- ============================================
    
    -- Appetizers
    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_available)
    VALUES 
        (v_restaurant_id, v_category_appetizers, 'Caesar Salad', 'Fresh romaine lettuce with parmesan', 8.99, true),
        (v_restaurant_id, v_category_appetizers, 'French Fries', 'Crispy golden fries', 4.99, true),
        (v_restaurant_id, v_category_appetizers, 'Chicken Wings', 'Spicy buffalo wings', 12.99, true),
        (v_restaurant_id, v_category_appetizers, 'Mozzarella Sticks', 'Breaded and fried', 7.99, true)
    ON CONFLICT DO NOTHING;

    -- Main Courses
    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_available)
    VALUES 
        (v_restaurant_id, v_category_mains, 'Classic Burger', 'Beef patty with lettuce, tomato, cheese', 14.99, true),
        (v_restaurant_id, v_category_mains, 'Margherita Pizza', 'Fresh mozzarella and basil', 16.99, true),
        (v_restaurant_id, v_category_mains, 'Pasta Carbonara', 'Creamy pasta with bacon', 15.99, true),
        (v_restaurant_id, v_category_mains, 'Grilled Chicken', 'With seasonal vegetables', 18.99, true),
        (v_restaurant_id, v_category_mains, 'Fish and Chips', 'Beer-battered cod', 17.99, true)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_burger;

    -- Desserts
    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_available)
    VALUES 
        (v_restaurant_id, v_category_desserts, 'Chocolate Cake', 'Rich and moist', 6.99, true),
        (v_restaurant_id, v_category_desserts, 'Ice Cream Sundae', 'Three scoops with toppings', 5.99, true),
        (v_restaurant_id, v_category_desserts, 'Tiramisu', 'Italian classic', 7.99, true),
        (v_restaurant_id, v_category_desserts, 'Cheesecake', 'New York style', 6.99, true)
    ON CONFLICT DO NOTHING;

    -- Beverages
    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_available)
    VALUES 
        (v_restaurant_id, v_category_beverages, 'Coca Cola', 'Classic soda', 2.99, true),
        (v_restaurant_id, v_category_beverages, 'Fresh Orange Juice', 'Squeezed daily', 4.99, true),
        (v_restaurant_id, v_category_beverages, 'Coffee', 'Freshly brewed', 3.99, true),
        (v_restaurant_id, v_category_beverages, 'Iced Tea', 'Refreshing', 2.99, true)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Menu items created successfully';

    -- ============================================
    -- Create Sample Orders (Last 30 days)
    -- ============================================
    
    -- Create 50 orders with varying dates, statuses, and amounts
    FOR i IN 1..50 LOOP
        -- Create order with random date in last 30 days
        INSERT INTO orders (
            restaurant_id, 
            table_number, 
            waiter_id, 
            status, 
            total_amount,
            created_at,
            updated_at
        )
        VALUES (
            v_restaurant_id,
            'T-' || (FLOOR(RANDOM() * 20) + 1)::TEXT, -- Random table 1-20
            v_waiter_user_id,
            CASE 
                WHEN i <= 5 THEN 'CREATED'::order_status
                WHEN i <= 10 THEN 'ACCEPTED'::order_status
                WHEN i <= 15 THEN 'COOKING'::order_status
                WHEN i <= 20 THEN 'READY'::order_status
                WHEN i <= 45 THEN 'SERVED'::order_status
                ELSE 'CANCELLED'::order_status
            END,
            0.00, -- Will be updated after adding items
            NOW() - (RANDOM() * INTERVAL '30 days'),
            NOW() - (RANDOM() * INTERVAL '30 days')
        )
        RETURNING id INTO v_order_id;

        -- Add 1-5 random items to each order
        DECLARE
            v_num_items INTEGER;
            v_random_item UUID;
            v_item_price DECIMAL(10,2);
            v_item_name VARCHAR(255);
            v_order_total DECIMAL(10,2) := 0;
        BEGIN
            v_num_items := FLOOR(RANDOM() * 5) + 1;
            
            FOR j IN 1..v_num_items LOOP
                -- Get a random menu item
                SELECT id, name, price INTO v_random_item, v_item_name, v_item_price
                FROM menu_items 
                WHERE restaurant_id = v_restaurant_id 
                ORDER BY RANDOM() 
                LIMIT 1;

                -- Insert order item
                INSERT INTO order_items (
                    order_id,
                    menu_item_id,
                    name,
                    price,
                    quantity,
                    notes
                )
                VALUES (
                    v_order_id,
                    v_random_item,
                    v_item_name,
                    v_item_price,
                    FLOOR(RANDOM() * 3) + 1, -- Quantity 1-3
                    CASE WHEN RANDOM() > 0.7 THEN 'Extra sauce' ELSE NULL END
                );

                -- Add to order total
                v_order_total := v_order_total + (v_item_price * (FLOOR(RANDOM() * 3) + 1));
            END LOOP;

            -- Update order total
            UPDATE orders SET total_amount = v_order_total WHERE id = v_order_id;

            -- Create invoice for served orders
            IF i <= 45 THEN -- Served orders
                INSERT INTO invoices (
                    order_id,
                    restaurant_id,
                    subtotal,
                    tax,
                    total
                )
                VALUES (
                    v_order_id,
                    v_restaurant_id,
                    v_order_total,
                    v_order_total * 0.10, -- 10% tax
                    v_order_total * 1.10
                )
                RETURNING id INTO v_invoice_id;

                -- Add payment for most served orders
                IF RANDOM() > 0.1 THEN -- 90% paid
                    INSERT INTO payments (
                        invoice_id,
                        amount,
                        method
                    )
                    VALUES (
                        v_invoice_id,
                        v_order_total * 1.10,
                        CASE 
                            WHEN RANDOM() > 0.5 THEN 'CARD'
                            ELSE 'CASH'
                        END
                    );
                END IF;
            END IF;

            -- Add status history
            INSERT INTO order_status_history (order_id, status, changed_by)
            VALUES (v_order_id, 'CREATED'::order_status, v_waiter_user_id);

            IF i > 5 THEN
                INSERT INTO order_status_history (order_id, status, changed_by, created_at)
                VALUES (v_order_id, 'ACCEPTED'::order_status, v_waiter_user_id, NOW() - (RANDOM() * INTERVAL '29 days'));
            END IF;

            IF i > 10 THEN
                INSERT INTO order_status_history (order_id, status, changed_by, created_at)
                VALUES (v_order_id, 'COOKING'::order_status, v_chef_user_id, NOW() - (RANDOM() * INTERVAL '28 days'));
            END IF;

            IF i > 15 THEN
                INSERT INTO order_status_history (order_id, status, changed_by, created_at)
                VALUES (v_order_id, 'READY'::order_status, v_chef_user_id, NOW() - (RANDOM() * INTERVAL '27 days'));
            END IF;

            IF i > 20 AND i <= 45 THEN
                INSERT INTO order_status_history (order_id, status, changed_by, created_at)
                VALUES (v_order_id, 'SERVED'::order_status, v_waiter_user_id, NOW() - (RANDOM() * INTERVAL '26 days'));
            END IF;

            IF i > 45 THEN
                INSERT INTO order_status_history (order_id, status, changed_by, created_at)
                VALUES (v_order_id, 'CANCELLED'::order_status, v_admin_user_id, NOW() - (RANDOM() * INTERVAL '25 days'));
            END IF;

        END;

        IF i % 10 = 0 THEN
            RAISE NOTICE 'Created % orders...', i;
        END IF;
    END LOOP;

    RAISE NOTICE 'Successfully created 50 orders with items, invoices, and payments!';
    RAISE NOTICE 'Order statuses: 5 CREATED, 5 ACCEPTED, 5 COOKING, 5 READY, 25 SERVED, 5 CANCELLED';
    
END $$;

-- ============================================
-- Verification Queries
-- ============================================

-- Check what was created
SELECT 'Orders Created' as info, COUNT(*) as count FROM orders;
SELECT 'Order Items Created' as info, COUNT(*) as count FROM order_items;
SELECT 'Invoices Created' as info, COUNT(*) as count FROM invoices;
SELECT 'Payments Created' as info, COUNT(*) as count FROM payments;

-- Sample analytics queries
SELECT 
    'Total Revenue (Last 30 Days)' as metric,
    TO_CHAR(SUM(total), 'FM$999,999.00') as value
FROM invoices 
WHERE created_at >= NOW() - INTERVAL '30 days';

SELECT 
    'Orders by Status' as metric,
    status,
    COUNT(*) as count
FROM orders
GROUP BY status
ORDER BY count DESC;

SELECT 
    'Top Selling Items' as metric,
    oi.name,
    SUM(oi.quantity) as total_sold,
    TO_CHAR(SUM(oi.price * oi.quantity), 'FM$999,999.00') as revenue
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE o.status = 'SERVED'
GROUP BY oi.name
ORDER BY total_sold DESC
LIMIT 10;
