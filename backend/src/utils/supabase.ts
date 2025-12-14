import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';


const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Admin client with Service Role (Bypasses RLS) - Use for Admin actions or specific system triggers
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
