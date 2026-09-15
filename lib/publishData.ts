// Publica um JSON gerado pelo worker no bucket público 'data' do Supabase Storage
// (14/09/2026). Usa a service role (SUPABASE_SERVICE_ROLE_KEY). Se faltar credencial
// ou o upload falhar, só loga: o arquivo local continua sendo escrito.
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const client = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;

export async function publishData(fileName: string, payload: unknown): Promise<boolean> {
    if (!client) {
        console.log(`publishData: sem SUPABASE_SERVICE_ROLE_KEY, pulando upload de ${fileName}`);
        return false;
    }
    const body = JSON.stringify(payload, null, 2);
    const { error } = await client.storage.from('data').upload(fileName, new Blob([body], { type: 'application/json' }), {
        upsert: true,
        contentType: 'application/json',
        cacheControl: '60',
    });
    if (error) {
        console.log(`publishData: falha ao publicar ${fileName}: ${error.message}`);
        return false;
    }
    console.log(`☁️  publishData: ${fileName} publicado no Storage (${body.length} bytes)`);
    return true;
}
