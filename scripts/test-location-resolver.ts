/**
 * Test script for LocationResolver
 * Run: docker exec endtimes_worker npx tsx scripts/test-location-resolver.ts
 */
import { resolveLocation } from '../lib/services/LocationResolver';

const TESTS: Array<{
    title: string;
    description: string;
    sourceName?: string;
    expected: string; // expected country/city name (case-insensitive substring)
}> = [
    // === THE BUG THAT TRIGGERED THIS ===
    {
        title: "Why some Singaporeans are saying no to having children amid 'existential' fertility crisis",
        description: '',
        sourceName: 'Channel News Asia',
        expected: 'Singapore'
    },

    // === DEMONYMS ===
    { title: 'French parliament votes to expand nuclear energy', description: '', expected: 'France' },
    { title: 'Brazilian protesters flood Sao Paulo streets', description: '', expected: 'Sao Paulo' }, // city beats country
    { title: 'Iranian military conducts ballistic missile test', description: '', expected: 'Iran' },
    { title: 'Ukrainian troops repel Russian assault near Kharkiv', description: '', expected: 'Kharkiv' }, // specific city beats country demonym
    { title: 'Israeli airstrike hits Rafah', description: '', expected: 'Rafah' },
    { title: 'American warships enter South China Sea', description: '', expected: 'South China Sea' },
    { title: 'British intelligence warns of Russian cyber attacks', description: '', expected: 'United Kingdom' }, // "british" = UK intelligence = correct subject
    { title: 'Saudi officials deny oil production cut', description: '', expected: 'Saudi' },
    { title: 'Pakistani army deploys to flood zones', description: '', expected: 'Pakistan' },
    { title: 'Nigerian election results disputed by opposition', description: '', expected: 'Nigeria' },
    { title: 'Australian government warns of Chinese espionage', description: '', expected: 'Australia' },
    { title: 'German chancellor meets with Zelensky in Kyiv', description: '', expected: 'Kyiv' },
    { title: 'Turkish lira hits record low', description: '', expected: 'Turkey' },
    { title: 'North Korean missile test raises alarms', description: '', expected: 'North Korea' },
    { title: 'Indonesian earthquake kills dozens in Java', description: '', expected: 'Indonesia' },
    { title: 'Mexican cartel violence escalates near border', description: '', expected: 'Mexico' },

    // === SPECIFIC OVERRIDES ===
    { title: 'China and Taiwan military standoff escalates', description: '', expected: 'Taiwan Strait' },
    { title: 'Russia and NATO hold emergency talks', description: '', expected: 'Russia-NATO' },
    { title: 'India and Pakistan exchange fire at border', description: '', expected: 'India-Pakistan' },

    // === CITIES ===
    { title: 'Explosion rocks downtown Baghdad', description: '', expected: 'Baghdad' },
    { title: 'Protests erupt in Hong Kong', description: '', expected: 'Hong Kong' },
    { title: 'Tokyo hit by 6.2 magnitude earthquake', description: '', expected: 'Tokyo' },
    { title: 'Airstrike targets Beirut suburb', description: '', expected: 'Beirut' },

    // === US STATES ===
    { title: 'Wildfires spread across California', description: '', expected: 'California' },
    { title: 'Hurricane makes landfall in Florida', description: '', expected: 'Florida' },
    { title: 'Texas power grid fails during cold snap', description: '', expected: 'Texas' },

    // === BRAZIL STATES ===
    { title: 'Flooding in Bahia leaves thousands homeless', description: '', expected: 'Bahia' },
    { title: 'Drug gang violence escalates in Ceará', description: '', expected: 'Ceará' },

    // === SOURCE BIAS FALLBACK ===
    {
        title: 'Economy grows 3% amid inflation concerns',
        description: '',
        sourceName: 'Jerusalem Post',
        expected: 'Israel'
    },

    // === FALSE POSITIVE GUARDS ===
    { title: 'New virus strain detected — experts alarmed', description: '', expected: '' }, // no location — should NOT match 'us' in 'virus'
    { title: 'UK study reveals new drug breakthrough', description: '', expected: 'United Kingdom' },

    // === PORTUGUESE / NON-ENGLISH TITLES ===
    {
        title: "Israel ataca assembleia que escolherá novo líder supremo do Irã; todos os 88 aiatolás estavam no local, dizem jornais israelenses",
        description: 'Segundo fontes em Roma e Berlim, o ataque foi confirmado.',
        sourceName: 'Folha de S.Paulo (Mundo)',
        expected: 'Israel' // title MUST win — NOT Rome from description
    },
    {
        title: 'Russos avançam em Kharkiv sob fogo ucraniano',
        description: '',
        expected: 'Kharkiv' // city beats demonym
    },
    {
        title: 'Ataque israelense deixa 40 mortos em Gaza',
        description: '',
        expected: 'Gaza' // city "Gaza" beats country demonym "Israeli"
    },
    {
        title: 'Iranianos atacam base americana no Iraque',
        description: '',
        expected: 'United States' // "americana"→"american"→USA wins by length; Iraq also referenced but both valid
    },

    // === ISRAEL + IRAN OVERRIDE ===
    {
        title: 'Israel and Iran exchanged missile strikes overnight',
        description: '',
        expected: 'Israel-Iran'
    },
];

let passed = 0;
let failed = 0;

console.log('\n🧪 LocationResolver Test Suite\n' + '='.repeat(60));

for (const test of TESTS) {
    const result = resolveLocation(test.title, test.description, test.sourceName);
    const resultName = result?.name?.toLowerCase() ?? '(null)';
    const ok = test.expected === ''
        ? result === null || !['russia', 'nato', 'united states', 'europe'].includes(resultName)
        : resultName.includes(test.expected.toLowerCase());

    const status = ok ? '✅' : '❌';
    if (ok) {
        passed++;
        console.log(`${status} "${test.title.substring(0, 60)}" → ${result?.name ?? 'null'} [${result?.confidence ?? '-'}]`);
    } else {
        failed++;
        console.log(`${status} "${test.title.substring(0, 60)}"`);
        console.log(`   Expected: "${test.expected}" | Got: "${result?.name ?? 'null'}" [${result?.confidence ?? '-'}]`);
    }
}

console.log('\n' + '='.repeat(60));
console.log(`Results: ${passed} passed / ${failed} failed / ${TESTS.length} total`);

if (failed > 0) {
    process.exit(1);
}
