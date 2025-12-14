
-- 1. Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Cleanup old attempts
DELETE FROM auth.users WHERE email = 'admin@restaurant.com';
DELETE FROM public.users WHERE email = 'admin@restaurant.com';

-- 3. Create Admin User (Auth + Public + Role)
DO $$
DECLARE
  new_user_id uuid;
  email_val text := 'admin@restaurant.com';
  password_val text := 'password123';
  restaurant_id_val uuid;
BEGIN
  -- Ensure a restaurant exists (Foreign Key requirement)
  SELECT id INTO restaurant_id_val FROM restaurants LIMIT 1;
  
  IF restaurant_id_val IS NULL THEN
     INSERT INTO restaurants (name, address) VALUES ('Default Restaurant', '123 Food Street')
     RETURNING id INTO restaurant_id_val;
  END IF;

  -- A. Insert into auth.users (With CRITICAL Empty String Fixes for email_change)
  -- The error explicitly says "converting NULL to string is unsupported" for "email_change".
  -- We MUST provide empty strings '' instead of NULLs or omitting them.
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change,
    email_change_token_new,
    is_super_admin
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    email_val,
    crypt(password_val, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"],"role":"admin"}',
    '{}',
    now(),
    now(),
    '', -- confirmation_token
    '', -- recovery_token
    '', -- CRITICAL: email_change must be empty string, not NULL
    '', -- email_change_token_new must be empty string, not NULL
    false
  ) RETURNING id INTO new_user_id;

  -- B. Insert into public.users
  INSERT INTO public.users (id, email, full_name, restaurant_id)
  VALUES (new_user_id, email_val, 'System Admin', restaurant_id_val);

  -- C. Insert into public.user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new_user_id, 'ADMIN');

END $$;
