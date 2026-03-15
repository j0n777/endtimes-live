/**
 * One-shot DDL migration: creates conflict_zones and nuclear_alerts in Supabase.
 * Run: npx tsx scripts/_migrate-tables.ts
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// We use the Supabase client with service role to call a stored procedure that
// runs arbitrary SQL. If no such procedure exists, we output the SQL to paste manually.
const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Test: check if table already exists
const { error: testError } = await supabase.from('conflict_zones').select('id').limit(1);

if (!testError) {
    console.log('✅ Table conflict_zones already exists. Running seed...');
    // Run seed directly
    const zones = [
        { name: 'Iran War Theater', type: 'WAR', severity: 'CRITICAL', center_lat: 32.0, center_lng: 54.0, radius_km: 750, color: '#dc2626', belligerents: ['United States', 'Israel', 'Iran', 'IRGC'], description: 'Active war theater — US-Israel joint operations against Iran.', start_date: '2026-02-28', casualties_estimate: '5.000+ mortos', key_developments: ['Khamenei killed', '1000+ targets struck'], is_active: true },
        { name: 'Guerra Rússia–Ucrânia', type: 'WAR', severity: 'CRITICAL', center_lat: 49.0, center_lng: 31.5, radius_km: 520, color: '#dc2626', belligerents: ['Rússia', 'Ucrânia', 'OTAN (apoio)'], description: 'Invasão russa em larga escala da Ucrânia desde fevereiro de 2022.', start_date: '2022-02-24', casualties_estimate: '500.000+ baixas', key_developments: ['Linhas de frente ativas em Donbas'], is_active: true },
        { name: 'Conflito Gaza–Israel', type: 'WAR', severity: 'HIGH', center_lat: 31.5, center_lng: 34.8, radius_km: 200, color: '#ea580c', belligerents: ['Israel (IDF)', 'Hamas', 'Jihad Islâmica'], description: 'Operações militares israelenses em Gaza após ataques de 7/10/2023.', start_date: '2023-10-07', casualties_estimate: '45.000+ mortos em Gaza', key_developments: ['Operações contínuas em Rafah'], is_active: true },
        { name: 'Teatro do Líbano', type: 'CRISIS', severity: 'HIGH', center_lat: 33.9, center_lng: 35.5, radius_km: 160, color: '#ea580c', belligerents: ['Israel (IDF)', 'Hezbollah', 'Irã (suporte)'], description: 'Confrontos militares no sul do Líbano.', start_date: '2023-10-08', casualties_estimate: '2.000+ mortos', key_developments: ['Trocas diárias de foguetes'], is_active: true },
        { name: 'Guerra Civil do Sudão', type: 'CIVIL_WAR', severity: 'HIGH', center_lat: 15.5, center_lng: 30.0, radius_km: 600, color: '#ea580c', belligerents: ['SAF', 'RSF'], description: 'Guerra civil entre SAF e RSF desde abril 2023.', start_date: '2023-04-15', casualties_estimate: '15.000+ mortos', key_developments: ['Fome declarada em várias regiões'], is_active: true },
        { name: 'Guerra Civil de Myanmar', type: 'CIVIL_WAR', severity: 'HIGH', center_lat: 19.5, center_lng: 96.0, radius_km: 500, color: '#ea580c', belligerents: ['Junta Militar (SAC)', 'NUG/PDF', 'EAOs'], description: 'Guerra civil após golpe militar de fevereiro 2021.', start_date: '2021-02-01', casualties_estimate: '50.000+ mortos', key_developments: ['Junta perde 50%+ do território'], is_active: true },
        { name: 'RDC Oriental — Conflito M23', type: 'WAR', severity: 'HIGH', center_lat: -1.5, center_lng: 29.0, radius_km: 350, color: '#ea580c', belligerents: ['FARDC', 'M23 (Rwanda/RDF)', 'FDLR', 'ADF'], description: 'Conflito no leste da RDC. M23 controla Goma desde jan 2026.', start_date: '2021-11-01', casualties_estimate: '7.000+ mortos', key_developments: ['M23 captura Goma em jan 2026'], is_active: true },
        { name: 'Insurgência no Sahel', type: 'INSURGENCY', severity: 'MEDIUM', center_lat: 16.0, center_lng: -2.0, radius_km: 900, color: '#f59e0b', belligerents: ['JNIM', 'ISGS', 'Wagner/África Corps', 'Juntas do Mali/Niger/BF'], description: 'Insurgência jihadista em expansão no Mali, Níger e Burkina Faso.', start_date: '2012-01-01', casualties_estimate: '20.000+ mortos nos últimos 5 anos', key_developments: ['Juntas formam Aliança dos Estados do Sahel'], is_active: true },
    ];
    for (const zone of zones) {
        const { error } = await supabase.from('conflict_zones').upsert(zone, { onConflict: 'name' });
        if (error) console.error(`❌ ${zone.name}:`, error.message);
        else console.log(`✅ ${zone.name}`);
    }
    console.log('\n✨ Done!');
} else {
    console.log('❌ Table conflict_zones does NOT exist yet.');
    console.log('Error:', testError.message);
    console.log('');
    console.log('📋 MANUAL ACTION REQUIRED:');
    console.log('Go to https://supabase.com/dashboard/project/bimfztwwzuwwefxfkkwe/editor');
    console.log('Paste and run the SQL from: scripts/migrate-conflict-zones.sql');
    console.log('Then re-run: npx tsx scripts/seed-conflict-zones.ts');
}
