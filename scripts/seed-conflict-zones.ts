/**
 * Seed script — conflict_zones + nuclear_alerts tables.
 *
 * Usage (inside worker container):
 *   npx tsx scripts/seed-conflict-zones.ts
 *
 * ⚠️  Run the SQL migration FIRST via Supabase dashboard:
 *      scripts/migrate-conflict-zones.sql
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Conflict Zones ───────────────────────────────────────────────────────────

const CONFLICT_ZONES = [
    {
        name: 'Iran War Theater',
        type: 'WAR',
        severity: 'CRITICAL',
        center_lat: 32.0,
        center_lng: 54.0,
        radius_km: 750,
        color: '#dc2626',
        belligerents: ['United States', 'Israel', 'Iran', 'IRGC', 'Houthis (aliados)'],
        description: 'Operação militar conjunta EUA-Israel (Operação Epic Fury / Operação Roaring Lion). Mais de 1.000 alvos atacados, incluindo instalações nucleares, militares e de liderança. O líder supremo Khamenei foi morto nos ataques a Teerã. O Irã retalia com mísseis e drones em toda a região.',
        start_date: '2026-02-28',
        casualties_estimate: '5.000+ mortos nas primeiras 72h',
        displaced_estimate: 'Milhões fugindo das grandes cidades',
        key_developments: [
            'Khamenei morto em ataques aéreos em Teerã',
            '1.000+ alvos iranianos atacados, incluindo Natanz e Fordow',
            '3 soldados americanos mortos em retaliação',
            'Retaliação com mísseis/drones do Irã em toda a região',
            'Houthis do Iêmen aumentam ataques no Mar Vermelho',
        ],
        is_active: true,
    },
    {
        name: 'Guerra Rússia–Ucrânia',
        type: 'WAR',
        severity: 'CRITICAL',
        center_lat: 49.0,
        center_lng: 31.5,
        radius_km: 520,
        color: '#dc2626',
        belligerents: ['Rússia', 'Ucrânia', 'OTAN (apoio)'],
        description: 'Invasão russa em larga escala da Ucrânia desde fevereiro de 2022. Linhas de frente ativas no leste e sul da Ucrânia. Confrontos intensos nas regiões de Donbas, Zaporizhzhia e Kherson. Contínuo uso de mísseis de cruzeiro e drones por ambos os lados.',
        start_date: '2022-02-24',
        casualties_estimate: '500.000+ baixas totais estimadas',
        displaced_estimate: '8+ milhões de deslocados internos',
        key_developments: [
            'Linhas de frente ativas em Donbas, Zaporizhzhia e Kherson',
            'Avanços russos ao longo de múltiplos setores',
            'Trocas contínuas de drones e mísseis',
            'Apoio militar e de inteligência da OTAN em andamento',
            'Ameaças nucleares russas periódicas',
        ],
        is_active: true,
    },
    {
        name: 'Conflito Gaza–Israel',
        type: 'WAR',
        severity: 'HIGH',
        center_lat: 31.5,
        center_lng: 34.8,
        radius_km: 200,
        color: '#ea580c',
        belligerents: ['Israel (IDF)', 'Hamas', 'Jihad Islâmica', 'Hezbollah (norte)'],
        description: 'Operações militares israelenses em Gaza após os ataques do Hamas em 7 de outubro de 2023. Conflito ampliado com frente no norte do Líbano contra o Hezbollah. Crise humanitária severa na Faixa de Gaza com acesso restrito a suprimentos.',
        start_date: '2023-10-07',
        casualties_estimate: '45.000+ mortos em Gaza',
        displaced_estimate: '1,9 milhão deslocados (90% da população)',
        key_developments: [
            'Operações terrestres contínuas em Rafah e Gaza City',
            'Crise humanitária com acesso restrito a alimentos e água',
            'Tensões com Líbano e Hezbollah',
            'Pressão internacional por cessar-fogo',
            'Ataques a infraestrutura civil criticados',
        ],
        is_active: true,
    },
    {
        name: 'Teatro do Líbano',
        type: 'CRISIS',
        severity: 'HIGH',
        center_lat: 33.9,
        center_lng: 35.5,
        radius_km: 160,
        color: '#ea580c',
        belligerents: ['Israel (IDF)', 'Hezbollah', 'Irã (suporte)'],
        description: 'Confrontos militares no sul do Líbano entre Israel e Hezbollah ligados à guerra de Gaza e ao teatro iraniano. Trocas frequentes de foguetes e ataques aéreos israelenses a posições do Hezbollah.',
        start_date: '2023-10-08',
        casualties_estimate: '2.000+ mortos no Líbano',
        displaced_estimate: '1 milhão deslocados no sul do Líbano',
        key_developments: [
            'Trocas diárias de foguetes e ataques aéreos',
            'Operações terrestres israelenses no sul do Líbano',
            'Secretário-Geral do Hezbollah Nasrallah morto (2024)',
            'Escalada vinculada ao conflito iraniano-israelense',
        ],
        is_active: true,
    },
    {
        name: 'Guerra Civil do Sudão',
        type: 'CIVIL_WAR',
        severity: 'HIGH',
        center_lat: 15.5,
        center_lng: 30.0,
        radius_km: 600,
        color: '#ea580c',
        belligerents: ['SAF (Exército do Sudão)', 'RSF (Forças de Apoio Rápido)'],
        description: 'Guerra civil entre as Forças Armadas do Sudão (SAF) e as Forças de Apoio Rápido (RSF) desde abril de 2023. Conflito originado de disputas de poder entre os generais Al-Burhan e Hemeti. Crise humanitária catastrófica com fome em escala.',
        start_date: '2023-04-15',
        casualties_estimate: '15.000+ mortos; genocídio relatado em Darfur',
        displaced_estimate: '8+ milhões deslocados — maior do mundo',
        key_developments: [
            'RSF controla grande parte de Darfur e Khartoum Oeste',
            'Fome declarada em várias regiões — pior crise humanitária global',
            'Relatórios de atrocidades étnicas em massa em Darfur',
            'Mediações internacionais sem cessar-fogo sustentado',
        ],
        is_active: true,
    },
    {
        name: 'Guerra Civil de Myanmar',
        type: 'CIVIL_WAR',
        severity: 'HIGH',
        center_lat: 19.5,
        center_lng: 96.0,
        radius_km: 500,
        color: '#ea580c',
        belligerents: ['Junta Militar (SAC)', 'NUG/PDF', 'EAOs (etnias armadas)'],
        description: 'Guerra civil em larga escala após o golpe militar de fevereiro de 2021. O Governo de Unidade Nacional (NUG) e dezenas de organizações étnicas armadas combatem a junta militar. A junta perdeu o controle de significativas partes do território.',
        start_date: '2021-02-01',
        casualties_estimate: '50.000+ mortos desde o golpe',
        displaced_estimate: '2+ milhões deslocados internamente',
        key_developments: [
            'Operação 1027 (2023): EAOs capturaram cidades estratégicas no norte',
            'Junta perde controle de 50%+ do território estimado',
            'Recrutamento compulsório implementado pela junta',
            'Corredores de fronteira com China em disputa',
        ],
        is_active: true,
    },
    {
        name: 'RDC Oriental — Conflito M23',
        type: 'WAR',
        severity: 'HIGH',
        center_lat: -1.5,
        center_lng: 29.0,
        radius_km: 350,
        color: '#ea580c',
        belligerents: ['Exército da RDC (FARDC)', 'M23 (Rwanda/RDF)', 'FDLR', 'ADF'],
        description: 'Conflito multifacetado no leste da República Democrática do Congo. O grupo M23, apoiado por Ruanda, controla vastas áreas incluindo Goma. Décenas de grupos armados operam na região com riquezas minerais estratégicas (coltan, ouro).',
        start_date: '2021-11-01',
        casualties_estimate: '7.000+ mortos; milhares de civis',
        displaced_estimate: '7 milhões deslocados no leste da RDC',
        key_developments: [
            'M23 captura Goma (capital de Kivu Norte) em janeiro de 2026',
            'Forças ruandesas acusadas de apoio direto ao M23',
            'EAU do leste da África tentam mediação',
            'Crise humanitária severa com estupro usado como arma',
        ],
        is_active: true,
    },
    {
        name: 'Insurgência no Sahel',
        type: 'INSURGENCY',
        severity: 'MEDIUM',
        center_lat: 16.0,
        center_lng: -2.0,
        radius_km: 900,
        color: '#f59e0b',
        belligerents: ['JNIM (Al-Qaeda)', 'ISGS (ISIS)', 'Wagner/África Corps', 'Juntas do Mali/Niger/BF'],
        description: 'Insurgência jihadista em expansão no Mali, Níger e Burkina Faso. Juntas militares expulsaram forças francesas e acolheram mercenários russos Wagner (renomeados África Corps). JNIM e ISIS-Sahel controlam áreas rurais crescentes.',
        start_date: '2012-01-01',
        casualties_estimate: '20.000+ mortos nos últimos 5 anos',
        displaced_estimate: '3 milhões deslocados na região',
        key_developments: [
            'Juntas de Mali, Níger e BF formam Aliança dos Estados do Sahel',
            'Expulsão das forças francesas e da MINUSMA',
            'Wagner/África Corps presentes em Mali e BF',
            'Ataques se expandem para países costeiros (Benim, Togo, Gana)',
        ],
        is_active: true,
    },
];

// ── Nuclear Alerts (empty by default — admin adds when needed) ───────────────
// Uncomment and fill below to add a nuclear alert when a real event occurs.

const NUCLEAR_ALERTS: object[] = [
    // {
    //     title: 'Teste Nuclear RPDC — Mar do Japão',
    //     lat: 38.0,
    //     lng: 130.0,
    //     yield_kt: 250,
    //     weapon_name: 'ICBM Hwasong-18 (estimado)',
    //     attacker: 'Coreia do Norte',
    //     defender: '',
    //     target_city: '',
    //     target_country: 'Mar do Japão (teste)',
    //     detonation_time: '2026-01-15T06:00:00Z',
    //     verified: false,
    //     ai_assessment: null,
    //     is_active: true,
    // },
];

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log('🌍 Seeding conflict zones and nuclear alerts...\n');

    // Insert conflict zones
    for (const zone of CONFLICT_ZONES) {
        const { error } = await supabase
            .from('conflict_zones')
            .insert(zone)
            .select();

        if (error) {
            console.error(`❌ Failed to seed "${zone.name}":`, error.message);
        } else {
            console.log(`✅ Seeded conflict zone: ${zone.name}`);
        }
    }

    // Upsert nuclear alerts (if any)
    for (const alert of NUCLEAR_ALERTS) {
        const { error } = await supabase
            .from('nuclear_alerts')
            .insert(alert)
            .select();

        if (error) {
            console.error('❌ Failed to seed nuclear alert:', error.message);
        } else {
            console.log(`☢ Seeded nuclear alert`);
        }
    }

    console.log('\n✨ Done! Conflict zones ready.');
    console.log('   💡 To add nuclear alerts, edit NUCLEAR_ALERTS array in this file and re-run.');
}

main().catch(console.error);
