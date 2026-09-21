// Reexporta o cliente único de lib/supabase.ts.
// Até 21/09/2026 este arquivo criava um segundo cliente e dava throw no topo do
// módulo quando VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY não existiam. Como a
// Lovable não injeta essas variáveis no build, o throw acontecia antes do
// ReactDOM.createRoot().render() e a página ficava preta. lib/supabase.ts já tem
// a URL e a publishable key públicas como fallback, então basta reaproveitá-lo.
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabase, supabaseUrl } from './supabase';

export type { SupabaseClient };
export { supabase };

// Service client for backend/admin operations (requires service role key)
// This will be used in Edge Functions/backend only
export const createServiceClient = (serviceRoleKey?: string) => {
    const key = serviceRoleKey ||
        import.meta.env.SUPABASE_SERVICE_ROLE_KEY ||
        import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

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
