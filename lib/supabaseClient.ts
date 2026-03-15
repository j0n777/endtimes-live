import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Helper to get environment variable (works in both Vite and Node.js)
function getEnv(key: string): string | undefined {
    // Try import.meta.env (Vite/browser)
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        return import.meta.env[key];
    }
    // Try process.env (Node.js)
    if (typeof process !== 'undefined' && process.env) {
        return process.env[key];
    }
    return undefined;
}

// Supabase configuration
const supabaseUrl = getEnv('VITE_SUPABASE_URL') ||
    getEnv('NEXT_PUBLIC_SUPABASE_URL');

const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') ||
    getEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('⛔ Supabase config missing: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be defined in your .env file.');
}

// Client for frontend use (public operations)
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Service client for backend/admin operations (requires service role key)
// This will be used in Edge Functions/backend only
export const createServiceClient = (serviceRoleKey?: string) => {
    const key = serviceRoleKey ||
        getEnv('SUPABASE_SERVICE_ROLE_KEY') ||
        getEnv('VITE_SUPABASE_SERVICE_ROLE_KEY');

    if (!key) {
        console.warn('⚠️ Service role key not provided, using anon key (limited permissions)');
        return supabase;
    }

    return createClient(supabaseUrl, key, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
};

export default supabase;
