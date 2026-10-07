// Reexporta o cliente único de lib/supabase.ts.
// Até 21/09/2026 este arquivo criava um segundo cliente e dava throw no topo do
// módulo quando VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY não existiam. Como a
// Lovable não injeta essas variáveis no build, o throw acontecia antes do
// ReactDOM.createRoot().render() e a página ficava preta. lib/supabase.ts já tem
// a URL e a publishable key públicas como fallback, então basta reaproveitá-lo.
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type { SupabaseClient };
export { supabase };

export default supabase;
