import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';


const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

// Admin client with Service Role (Bypasses RLS) - Use for Admin actions or specific system triggers
if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase Environment Variables: Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

console.log(`Supabase Client Initialized. URL: ${supabaseUrl}`);

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
