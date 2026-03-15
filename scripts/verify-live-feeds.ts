/**
 * verify-live-feeds.ts
 *
 * Verifies that each YouTube channel in CURATED_CAMS:
 *   1. Has a valid UC channel ID (channel page returns 200, not 404)
 *   2. Supports the live_stream embed (oEmbed check)
 *
 * Usage:
 *   npx ts-node scripts/verify-live-feeds.ts
 *   npx ts-node scripts/verify-live-feeds.ts --fix    (prints corrected IDs when possible)
 *
 * Output:
 *   ✅  OK     — channel exists, embed likely works
 *   ⚠️  LIVE?  — channel exists but may not be currently streaming
 *   ❌  FAIL   — channel does not exist (wrong ID)
 *   ⏭️  SKIP   — not a YouTube channel entry
 */

import { CURATED_CAMS } from '../lib/camsData';

const DELAY_MS = 1200; // polite delay between requests

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

interface CheckResult {
    id: string;
    name: string;
    channelId: string | null;
    channelExists: boolean | null;
    oembedOk: boolean | null;
    error?: string;
}

/**
 * Extracts UCxxx channel ID from an embed URL.
 * Supports both `live_stream?channel=UCxxx` and `embed/VIDEO_ID` formats.
 */
function extractChannelId(embedUrl: string): string | null {
    const match = embedUrl.match(/channel=([^&]+)/);
    return match ? match[1] : null;
}

/**
 * Checks if a YouTube channel exists by requesting its page.
 * YouTube returns 200 for valid channels and either redirects or 404 for invalid ones.
 */
async function checkChannelExists(channelId: string): Promise<boolean> {
    const url = `https://www.youtube.com/channel/${channelId}`;
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; LiveFeedVerifier/1.0)',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            redirect: 'follow',
        });

        if (!res.ok) return false;

        const html = await res.text();
        // YouTube shows these strings when a channel doesn't exist
        const notFound =
            html.includes('This channel does not exist') ||
            html.includes('404 Not Found') ||
            html.includes('"error":{"code":404');
        return !notFound;
    } catch {
        return false;
    }
}

/**
 * Uses YouTube's oEmbed API to check if the live_stream embed resolves.
 * oEmbed returns 200 + JSON if the URL is embeddable, 404 if not.
 */
async function checkOembed(channelId: string): Promise<boolean> {
    const videoUrl = encodeURIComponent(
        `https://www.youtube.com/embed/live_stream?channel=${channelId}`
    );
    const oembedUrl = `https://www.youtube.com/oembed?url=${videoUrl}&format=json`;
    try {
        const res = await fetch(oembedUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        return res.ok;
    } catch {
        return false;
    }
}

async function main() {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  EndTimesMonitor — Live Feed Verifier');
    console.log(`  Checking ${CURATED_CAMS.length} cameras...`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    const results: CheckResult[] = [];

    for (const cam of CURATED_CAMS) {
        if (cam.type !== 'youtube') {
            console.log(`⏭️  SKIP  ${cam.name} (not YouTube)`);
            results.push({ id: cam.id, name: cam.name, channelId: null, channelExists: null, oembedOk: null });
            continue;
        }

        const channelId = extractChannelId(cam.embedUrl);

        if (!channelId) {
            console.log(`⏭️  SKIP  ${cam.name} — no channelId in embedUrl`);
            results.push({ id: cam.id, name: cam.name, channelId: null, channelExists: null, oembedOk: null });
            continue;
        }

        process.stdout.write(`  Checking: ${cam.name.padEnd(40)} [${channelId}] ... `);

        let channelExists: boolean;
        let oembedOk: boolean;
        let error: string | undefined;

        try {
            channelExists = await checkChannelExists(channelId);
            await delay(400);
            oembedOk = channelExists ? await checkOembed(channelId) : false;
        } catch (e) {
            channelExists = false;
            oembedOk = false;
            error = String(e);
        }

        const icon = !channelExists ? '❌ FAIL ' : oembedOk ? '✅ OK   ' : '⚠️  LIVE?';
        console.log(icon);

        results.push({ id: cam.id, name: cam.name, channelId, channelExists, oembedOk, error });

        await delay(DELAY_MS);
    }

    // Summary
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');

    const ok       = results.filter(r => r.channelExists && r.oembedOk);
    const liveOnly = results.filter(r => r.channelExists && !r.oembedOk && r.channelId !== null);
    const fail     = results.filter(r => r.channelExists === false);
    const skipped  = results.filter(r => r.channelId === null);

    console.log(`  ✅ OK (channel exists + embed works): ${ok.length}`);
    console.log(`  ⚠️  Channel exists but embed uncertain: ${liveOnly.length}`);
    console.log(`  ❌ FAIL (wrong/invalid channel ID): ${fail.length}`);
    console.log(`  ⏭️  Skipped (non-YouTube): ${skipped.length}`);

    if (fail.length > 0) {
        console.log('');
        console.log('  ❌ FAILED channels — update these IDs in lib/camsData.ts:');
        fail.forEach(r => {
            console.log(`     ${r.name}`);
            console.log(`       channelId: ${r.channelId}`);
            console.log(`       → Find correct ID at: youtube.com/@<handle>/about`);
        });
    }

    if (liveOnly.length > 0) {
        console.log('');
        console.log('  ⚠️  Uncertain channels (check manually if offline):');
        liveOnly.forEach(r => {
            console.log(`     ${r.name} [${r.channelId}]`);
            console.log(`       → https://www.youtube.com/channel/${r.channelId}/live`);
        });
    }

    console.log('');
    console.log('  Tip: Run this script periodically (e.g. monthly) to catch stale IDs.');
    console.log('       Add to a cron job or npm script: "verify-feeds": "ts-node scripts/verify-live-feeds.ts"');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    process.exit(fail.length > 0 ? 1 : 0);
}

main().catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
});
