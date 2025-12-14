
You will need to create an Admin user in your Supabase project manually or via a SQL script since no default user was provided.

### Option 1: Create via Supabase Dashboard (Easiest)
1. Go to your **Supabase Dashboard** -> **Authentication** -> **Users**.
2. Click **Add User** -> **Create New User**.
3. Enter an email (e.g., `admin@restaurant.com`) and a password.
4. Auto-confirm the email if possible.
5. **CRITICAL STEP**: Assign the 'admin' role. 
   - Unfortunately, you cannot set `app_metadata` or `user_metadata` directly in the UI easily during creation.
   - **Workaround**: After creating the user, run this SQL in **Supabase SQL Editor**:
   ```sql
   -- Replace 'admin@restaurant.com' with your email
   UPDATE auth.users 
   SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
   WHERE email = 'admin@restaurant.com';
   ```

### Option 2: Run this SQL Script
Copy and paste this into your **Supabase SQL Editor** to create a user and assign the role immediately.

```sql
-- Change these values
DO $$
DECLARE
  new_user_id uuid;
  user_email text := 'admin@restaurant.com';
  user_password text := 'admin123';
BEGIN
  -- Insert user into auth.users (works if you have permissions or run as Service Role/Postgres)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    user_email,
    crypt(user_password, gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"],"role":"admin"}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO new_user_id;

  -- Create entry in public.users table if your schema requires it (based on your schema.sql)
  -- This assumes you have a public.users table linked to auth.users
  INSERT INTO public.users (id, email)
  VALUES (new_user_id, user_email);

END $$;
```

**Note**: The "Admin Panel" enforces the role check in `middleware.ts`. If you log in without the `admin` role, you will be redirected to `/unauthorized`.
