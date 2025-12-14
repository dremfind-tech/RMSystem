
import { createClient } from './supabaseClient';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:3000';

type RequestOptions = RequestInit & {
    token?: string;
};

export async function apiClient(endpoint: string, options: RequestOptions = {}) {
    const supabase = createClient();
    let token = options.token;

    if (!token) {
        const { data } = await supabase.auth.getSession();
        token = data.session?.access_token;
    }

    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || `API Error: ${res.statusText}`);
    }

    const text = await res.text();
    return text ? JSON.parse(text) : {};
}
