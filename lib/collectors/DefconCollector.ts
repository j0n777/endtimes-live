import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

export interface DefconData {
    level: 1 | 2 | 3 | 4 | 5;
    codename: string;
    source: string;
    timestamp: string;
}

/**
 * Standalone OSINT collector — scrapes defconlevel.com (not a BaseCollector)
 * Writes /app/public/data/defcon.json every ~30 minutes.
 * Does NOT interact with Supabase.
 */
export class DefconCollector {
    private readonly outputPath: string;
    private readonly minIntervalMs = 25 * 60 * 1000; // 25 min throttle
    private lastRunAt: Date | null = null;

    private static readonly CODENAME_MAP: Record<number, string> = {
        1: 'COCKED PISTOL',
        2: 'FAST PACE',
        3: 'ROUND HOUSE',
        4: 'DOUBLE TAKE',
        5: 'FADE OUT',
    };

    constructor(outputPath = '/app/public/data/defcon.json') {
        this.outputPath = outputPath;
    }

    async run(): Promise<void> {
        if (this.lastRunAt && Date.now() - this.lastRunAt.getTime() < this.minIntervalMs) {
            const agoMin = Math.round((Date.now() - this.lastRunAt.getTime()) / 60000);
            console.log(`⏳ DEFCON_MONITOR: Skipping (ran ${agoMin}m ago, next in ~${25 - agoMin}m)`);
            return;
        }

        try {
            console.log('🔍 DEFCON_MONITOR: Fetching from defconlevel.com...');
            const html = await this.fetchHtml('https://www.defconlevel.com/current-level.php');

            const level = this.parseDefconLevel(html);
            if (!level) {
                console.warn('⚠️ DEFCON_MONITOR: Could not parse DEFCON level from page');
                return;
            }

            const codename = this.parseCodename(html) ?? DefconCollector.CODENAME_MAP[level];

            const data: DefconData = {
                level,
                codename,
                source: 'defconlevel.com',
                timestamp: new Date().toISOString(),
            };

            const dir = path.dirname(this.outputPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.outputPath, JSON.stringify(data, null, 2));
            this.lastRunAt = new Date();
            console.log(`✅ DEFCON_MONITOR: Wrote DEFCON ${level} "${codename}" → ${this.outputPath}`);

        } catch (error) {
            console.error('❌ DEFCON_MONITOR: Failed:', error instanceof Error ? error.message : error);
        }
    }

    private fetchHtml(url: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const options = {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                },
                timeout: 12000,
            };

            const req = https.get(url, options, (res) => {
                // Follow single redirect
                if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
                    this.fetchHtml(res.headers.location).then(resolve).catch(reject);
                    res.resume();
                    return;
                }
                if (!res.statusCode || res.statusCode >= 400) {
                    reject(new Error(`HTTP ${res.statusCode}`));
                    return;
                }
                let data = '';
                res.setEncoding('utf8');
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => resolve(data));
                res.on('error', reject);
            });

            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
        });
    }

    private parseDefconLevel(html: string): (1 | 2 | 3 | 4 | 5) | null {
        // Multiple strategies, most specific first
        const patterns = [
            // e.g. "DEFCON 3" or "DEFCON Level 3"
            /DEFCON\s*(?:Level\s*)?(\d)/i,
            // e.g. "Level: 3"
            /current[^<]*level[^<]*?(\d)/i,
            // Bold/heading with single digit
            /<(?:strong|b|h[1-4])[^>]*>\s*(\d)\s*<\/(?:strong|b|h[1-4])>/i,
        ];

        for (const pat of patterns) {
            const m = html.match(pat);
            if (m) {
                const n = parseInt(m[1], 10) as 1 | 2 | 3 | 4 | 5;
                if (n >= 1 && n <= 5) return n;
            }
        }
        return null;
    }

    private parseCodename(html: string): string | null {
        const codenames = ['COCKED PISTOL', 'FAST PACE', 'ROUND HOUSE', 'DOUBLE TAKE', 'FADE OUT'];
        for (const name of codenames) {
            // Allow spaces/hyphens in HTML (e.g. "ROUND&nbsp;HOUSE")
            const escaped = name.replace(/\s+/g, '[\\s\\-&;a-z]*');
            if (new RegExp(escaped, 'i').test(html)) {
                return name;
            }
        }
        return null;
    }
}
