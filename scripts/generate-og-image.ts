/**
 * generate-og-image.ts
 *
 * Converts /public/og-banner.svg → /public/og-banner.jpg (1200×630)
 * for use as the Open Graph sharing image.
 *
 * Requirements: npm install -D sharp
 * Usage:       npx ts-node scripts/generate-og-image.ts
 *
 * After running, og-banner.jpg will be served at /og-banner.jpg
 * and referenced in components/SEOHead.tsx as the og:image.
 */

import * as path from 'path';
import * as fs from 'fs';

const PUBLIC_DIR = path.resolve(__dirname, '../public');
const SVG_PATH   = path.join(PUBLIC_DIR, 'og-banner.svg');
const OUT_PATH   = path.join(PUBLIC_DIR, 'og-banner.jpg');

async function main() {
    let sharp: typeof import('sharp');
    try {
        sharp = (await import('sharp')).default as any;
    } catch {
        console.error('❌ sharp is not installed. Run: npm install -D sharp');
        process.exit(1);
    }

    if (!fs.existsSync(SVG_PATH)) {
        console.error(`❌ SVG not found: ${SVG_PATH}`);
        process.exit(1);
    }

    console.log('🖼️  Converting og-banner.svg → og-banner.jpg ...');

    await (sharp as any)(SVG_PATH)
        .resize(1200, 630)
        .jpeg({ quality: 92 })
        .toFile(OUT_PATH);

    const stats = fs.statSync(OUT_PATH);
    console.log(`✅ Generated: ${OUT_PATH} (${Math.round(stats.size / 1024)} KB)`);
    console.log('   Social platforms will use: https://endtimes.live/og-banner.jpg');
}

main().catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
});
