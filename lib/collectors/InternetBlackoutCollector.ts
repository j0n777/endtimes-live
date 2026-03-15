import { BaseCollector, CollectorConfig } from './BaseCollector';
import { SupabaseClient } from '@supabase/supabase-js';
import { MonitorEvent, EventCategory, Severity, SourceType } from '../../types';

// IODA API - Internet Outage Detection & Analysis (Georgia Tech)
const IODA_API_URL = 'https://api.ioda.inetintel.cc.gatech.edu/v2/outages/alerts';
// NetBlocks RSS - Internet freedom / blackout reports
const NETBLOCKS_RSS_URL = 'https://netblocks.org/feed';

// ISO-2 country codes → { lat, lng, name }
// Covers countries most commonly affected by internet shutdowns
const COUNTRY_COORDS: Record<string, { lat: number; lng: number }> = {
    AF: { lat: 33.93, lng: 67.71 },  // Afghanistan
    AL: { lat: 41.15, lng: 20.17 },  // Albania
    DZ: { lat: 28.03, lng: 1.66 },   // Algeria
    AO: { lat: -11.2, lng: 17.87 },  // Angola
    AR: { lat: -38.42, lng: -63.62 }, // Argentina
    AM: { lat: 40.07, lng: 45.04 },  // Armenia
    AZ: { lat: 40.14, lng: 47.58 },  // Azerbaijan
    BD: { lat: 23.68, lng: 90.36 },  // Bangladesh
    BY: { lat: 53.71, lng: 27.95 },  // Belarus
    BJ: { lat: 9.31, lng: 2.32 },    // Benin
    BO: { lat: -16.29, lng: -63.59 }, // Bolivia
    BA: { lat: 43.92, lng: 17.68 },  // Bosnia
    BR: { lat: -14.24, lng: -51.93 }, // Brazil
    BF: { lat: 12.36, lng: -1.54 },  // Burkina Faso
    BI: { lat: -3.37, lng: 29.92 },  // Burundi
    KH: { lat: 12.57, lng: 104.99 }, // Cambodia
    CM: { lat: 3.85, lng: 11.5 },    // Cameroon
    CF: { lat: 6.61, lng: 20.94 },   // Central African Republic
    TD: { lat: 15.45, lng: 18.73 },  // Chad
    CL: { lat: -35.68, lng: -71.54 }, // Chile
    CN: { lat: 35.86, lng: 104.2 },  // China
    CO: { lat: 4.57, lng: -74.3 },   // Colombia
    CD: { lat: -4.04, lng: 21.76 },  // Congo (DRC)
    CG: { lat: -0.23, lng: 15.83 },  // Congo (Republic)
    CR: { lat: 9.75, lng: -83.75 },  // Costa Rica
    CI: { lat: 7.54, lng: -5.55 },   // Cote d'Ivoire
    CU: { lat: 21.52, lng: -77.78 }, // Cuba
    CY: { lat: 35.13, lng: 33.43 },  // Cyprus
    EG: { lat: 26.82, lng: 30.8 },   // Egypt
    ET: { lat: 9.15, lng: 40.49 },   // Ethiopia
    GA: { lat: -0.8, lng: 11.61 },   // Gabon
    GH: { lat: 7.95, lng: -1.02 },   // Ghana
    GN: { lat: 9.95, lng: -11.24 },  // Guinea
    GW: { lat: 11.8, lng: -15.18 },  // Guinea-Bissau
    HT: { lat: 18.97, lng: -72.29 }, // Haiti
    HN: { lat: 15.2, lng: -86.24 },  // Honduras
    HK: { lat: 22.32, lng: 114.17 }, // Hong Kong
    IN: { lat: 20.59, lng: 78.96 },  // India
    ID: { lat: -0.79, lng: 113.92 }, // Indonesia
    IR: { lat: 32.43, lng: 53.69 },  // Iran
    IQ: { lat: 33.22, lng: 43.68 },  // Iraq
    JO: { lat: 30.59, lng: 36.24 },  // Jordan
    KZ: { lat: 48.02, lng: 66.92 },  // Kazakhstan
    KE: { lat: -0.02, lng: 37.91 },  // Kenya
    KW: { lat: 29.31, lng: 47.48 },  // Kuwait
    KG: { lat: 41.2, lng: 74.77 },   // Kyrgyzstan
    LA: { lat: 19.86, lng: 102.5 },  // Laos
    LB: { lat: 33.85, lng: 35.86 },  // Lebanon
    LY: { lat: 26.34, lng: 17.23 },  // Libya
    ML: { lat: 17.57, lng: -3.99 },  // Mali
    MR: { lat: 21.01, lng: -10.94 }, // Mauritania
    MX: { lat: 23.63, lng: -102.55 }, // Mexico
    MD: { lat: 47.41, lng: 28.37 },  // Moldova
    MN: { lat: 46.86, lng: 103.85 }, // Mongolia
    MA: { lat: 31.79, lng: -7.09 },  // Morocco
    MZ: { lat: -18.67, lng: 35.53 }, // Mozambique
    MM: { lat: 21.92, lng: 95.96 },  // Myanmar
    NA: { lat: -22.96, lng: 18.49 }, // Namibia
    NP: { lat: 28.39, lng: 84.12 },  // Nepal
    NI: { lat: 12.87, lng: -85.21 }, // Nicaragua
    NE: { lat: 17.61, lng: 8.08 },   // Niger
    NG: { lat: 9.08, lng: 8.68 },    // Nigeria
    KP: { lat: 40.34, lng: 127.51 }, // North Korea
    PK: { lat: 30.38, lng: 69.35 },  // Pakistan
    PS: { lat: 31.95, lng: 35.23 },  // Palestine
    PE: { lat: -9.19, lng: -75.02 }, // Peru
    PH: { lat: 12.88, lng: 121.77 }, // Philippines
    RU: { lat: 61.52, lng: 105.32 }, // Russia
    RW: { lat: -1.94, lng: 29.87 },  // Rwanda
    SA: { lat: 23.89, lng: 45.08 },  // Saudi Arabia
    SN: { lat: 14.5, lng: -14.45 },  // Senegal
    SO: { lat: 5.15, lng: 46.2 },    // Somalia
    ZA: { lat: -30.56, lng: 22.94 }, // South Africa
    SS: { lat: 6.88, lng: 31.31 },   // South Sudan
    SD: { lat: 12.86, lng: 30.22 },  // Sudan
    SY: { lat: 34.8, lng: 38.99 },   // Syria
    TW: { lat: 23.7, lng: 121.0 },   // Taiwan
    TJ: { lat: 38.86, lng: 71.28 },  // Tajikistan
    TZ: { lat: -6.37, lng: 34.89 },  // Tanzania
    TH: { lat: 15.87, lng: 100.99 }, // Thailand
    TL: { lat: -8.87, lng: 125.73 }, // Timor-Leste
    TG: { lat: 8.62, lng: 0.82 },    // Togo
    TN: { lat: 33.89, lng: 9.54 },   // Tunisia
    TR: { lat: 38.96, lng: 35.24 },  // Turkey
    TM: { lat: 38.97, lng: 59.56 },  // Turkmenistan
    UG: { lat: 1.37, lng: 32.29 },   // Uganda
    UA: { lat: 48.38, lng: 31.17 },  // Ukraine
    AE: { lat: 23.42, lng: 53.85 },  // UAE
    US: { lat: 37.09, lng: -95.71 }, // USA
    UZ: { lat: 41.38, lng: 64.59 },  // Uzbekistan
    VE: { lat: 6.42, lng: -66.59 },  // Venezuela
    VN: { lat: 14.06, lng: 108.28 }, // Vietnam
    YE: { lat: 15.55, lng: 48.52 },  // Yemen
    ZM: { lat: -13.13, lng: 27.85 }, // Zambia
    ZW: { lat: -19.02, lng: 29.15 }, // Zimbabwe
    // Southeast Asia
    MY: { lat: 4.21, lng: 108.96 },  // Malaysia
    SG: { lat: 1.35, lng: 103.82 },  // Singapore
    BN: { lat: 4.54, lng: 114.73 },  // Brunei
    // South Asia
    LK: { lat: 7.87, lng: 80.77 },   // Sri Lanka
    MV: { lat: 3.20, lng: 73.22 },   // Maldives
    BT: { lat: 27.51, lng: 90.43 },  // Bhutan
    // Middle East / North Africa
    BH: { lat: 26.07, lng: 50.56 },  // Bahrain
    OM: { lat: 21.51, lng: 55.92 },  // Oman
    QA: { lat: 25.35, lng: 51.18 },  // Qatar
    // Europe / Central Asia
    GE: { lat: 42.31, lng: 43.36 },  // Georgia
    KS: { lat: 42.60, lng: 20.90 },  // Kosovo
    MK: { lat: 41.61, lng: 21.75 },  // North Macedonia
    // Other
    CU: { lat: 21.52, lng: -77.78 }, // Cuba (already added, keep)
    // Pacific
    FJ: { lat: -17.71, lng: 178.07 }, // Fiji
    PG: { lat: -6.31, lng: 143.96 }, // Papua New Guinea
};

export class InternetBlackoutCollector extends BaseCollector {
    constructor(supabase: SupabaseClient) {
        const config: CollectorConfig = {
            name: 'INTERNET_BLACKOUT',
            cacheDurationSeconds: 1800, // 30 min
            rateLimitPerMinute: 10,
            maxRetries: 3,
            circuitBreakerThreshold: 5,
            circuitBreakerTimeout: 300
        };
        super(config, supabase);
    }

    protected async fetchData(): Promise<MonitorEvent[]> {
        const [iodaEvents, netblocksEvents] = await Promise.allSettled([
            this.fetchIODA(),
            this.fetchNetBlocks()
        ]);

        const events: MonitorEvent[] = [];

        if (iodaEvents.status === 'fulfilled') {
            events.push(...iodaEvents.value);
        } else {
            console.warn('⚠️ IODA fetch failed:', iodaEvents.reason);
        }

        if (netblocksEvents.status === 'fulfilled') {
            events.push(...netblocksEvents.value);
        } else {
            console.warn('⚠️ NetBlocks fetch failed:', netblocksEvents.reason);
        }

        // Deduplicate by country — keep highest severity per country
        const deduped = this.deduplicateByCountry(events);
        console.log(`🌐 InternetBlackout: ${events.length} raw → ${deduped.length} after dedup`);

        return deduped;
    }

    // ------------------------------------------------------------------
    // IODA API — real-time country-level BGP/active-probe outage data
    // ------------------------------------------------------------------
    private async fetchIODA(): Promise<MonitorEvent[]> {
        const now = Math.floor(Date.now() / 1000);
        const yesterday = now - 86400;
        const url = `${IODA_API_URL}?from=${yesterday}&until=${now}&limit=100&entityType=country`;

        const response = await fetch(url, { headers: { 'User-Agent': 'EndTimesMonitor/1.0' } });
        if (!response.ok) throw new Error(`IODA fetch failed: ${response.status}`);

        const json = await response.json();
        if (!json.data || !Array.isArray(json.data)) return [];

        // Only include critical/warning outages — skip "normal" level
        const alerts = json.data.filter(
            (a: any) => a.level === 'critical' || a.level === 'warning'
        );

        console.log(`📡 IODA: ${json.data.length} total alerts, ${alerts.length} critical/warning`);

        return alerts.map((alert: any) => {
            const countryCode = alert.entity?.code || '';
            const countryName = alert.entity?.name || 'Unknown';
            const coords = COUNTRY_COORDS[countryCode] || { lat: 0, lng: 0 };
            const severity = this.iodaLevelToSeverity(alert.level);
            const pctDrop = alert.historyValue > 0
                ? Math.round((1 - alert.value / alert.historyValue) * 100)
                : 0;

            return {
                id: this.generateId(`ioda-${countryCode}-${alert.time}-${alert.datasource}`),
                title: `Internet Blackout: ${countryName}`,
                description: `IODA detected a ${alert.level.toUpperCase()} internet outage in ${countryName}. ` +
                    `BGP routing dropped ~${pctDrop}% below historical baseline. ` +
                    `Data source: ${alert.datasource?.toUpperCase() || 'BGP'}. ` +
                    `Affected routes: ${alert.value?.toLocaleString() || '?'} (baseline: ${alert.historyValue?.toLocaleString() || '?'}).`,
                category: EventCategory.INTERNET_BLACKOUT,
                severity,
                sourceType: SourceType.RSS,
                sourceName: 'IODA (Georgia Tech)',
                location: countryName,
                coordinates: coords,
                timestamp: new Date(alert.time * 1000).toISOString(),
                sourceUrl: `https://ioda.inetintel.cc.gatech.edu/country/${countryCode}`,
                tags: ['internet', 'blackout', 'outage', countryName.toLowerCase(), countryCode.toLowerCase()]
            } as MonitorEvent;
        });
    }

    // ------------------------------------------------------------------
    // NetBlocks RSS — Reports with images and context
    // ------------------------------------------------------------------
    private async fetchNetBlocks(): Promise<MonitorEvent[]> {
        const response = await fetch(NETBLOCKS_RSS_URL, {
            headers: { 'User-Agent': 'EndTimesMonitor/1.0' }
        });
        if (!response.ok) throw new Error(`NetBlocks fetch failed: ${response.status}`);

        const xml = await response.text();
        const items = await this.parseRSS(xml);

        // Process reports from the last 365 days (NetBlocks publishes infrequently)
        const cutoff = Date.now() - 365 * 24 * 60 * 60 * 1000;
        const recent = items.filter(item => {
            const ts = new Date(item.pubDate).getTime();
            return !isNaN(ts) && ts > cutoff;
        });

        console.log(`📰 NetBlocks: ${items.length} total, ${recent.length} within 30 days`);

        return recent.map(item => {
            const location = this.extractLocationFromTitle(item.title);
            const mediaUrl = this.extractImage(item.content || item.description);
            const severity = this.titleToSeverity(item.title);

            return {
                id: this.generateId(`nb-${item.link}`),
                title: item.title,
                description: this.stripHtml(item.description).substring(0, 500),
                category: EventCategory.INTERNET_BLACKOUT,
                severity,
                sourceType: SourceType.RSS,
                sourceName: 'NetBlocks',
                location,
                coordinates: { lat: 0, lng: 0 }, // Will be auto-geocoded by BaseCollector
                timestamp: new Date(item.pubDate).toISOString(),
                sourceUrl: item.link,
                mediaUrl: mediaUrl || undefined,
                mediaType: mediaUrl ? 'image' : undefined,
            } as MonitorEvent;
        });
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private iodaLevelToSeverity(level: string): Severity {
        if (level === 'critical') return 'HIGH';
        if (level === 'warning') return 'ELEVATED';
        return 'MEDIUM';
    }

    private titleToSeverity(title: string): Severity {
        const t = title.toLowerCase();
        if (t.includes('blackout') || t.includes('nationwide') || t.includes('total')) return 'HIGH';
        if (t.includes('disruption') || t.includes('restricted') || t.includes('blocked')) return 'ELEVATED';
        return 'MEDIUM';
    }

    private extractLocationFromTitle(title: string): string {
        // Patterns: "Internet cut in COUNTRY", "Internet shutdown in COUNTRY"
        // "X disrupted in COUNTRY", "PLATFORM blocked in COUNTRY on ..."
        const patterns = [
            /\bin ([A-Z][a-zA-Z\s\-]+?)(?:\s+on\b|\s+as\b|\s+amid\b|\s+during\b|$)/,
            /^([A-Z][a-zA-Z\s]+)\s+(?:internet|network|connectivity)/i,
        ];
        for (const re of patterns) {
            const m = title.match(re);
            if (m) return m[1].trim();
        }
        return 'Global';
    }

    private extractImage(html: string): string | null {
        if (!html) return null;
        const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
        return match ? match[1] : null;
    }

    private stripHtml(html: string): string {
        return html
            .replace(/<[^>]+>/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#8217;/g, "'")
            .replace(/\s+/g, ' ')
            .trim();
    }

    private deduplicateByCountry(events: MonitorEvent[]): MonitorEvent[] {
        const seen = new Map<string, MonitorEvent>();
        const severityRank: Record<string, number> = { HIGH: 4, ELEVATED: 3, MEDIUM: 2, LOW: 1 };

        for (const event of events) {
            const key = event.location.toLowerCase().trim();
            const existing = seen.get(key);
            if (!existing || (severityRank[event.severity] || 0) > (severityRank[existing.severity] || 0)) {
                seen.set(key, event);
            }
        }

        return Array.from(seen.values());
    }

    private async parseRSS(xml: string): Promise<any[]> {
        let parser: DOMParser;
        if (typeof DOMParser === 'undefined') {
            const jsdom = await import('jsdom');
            const dom = new jsdom.JSDOM();
            parser = new dom.window.DOMParser();
        } else {
            parser = new DOMParser();
        }

        const doc = parser.parseFromString(xml, 'text/xml');
        const itemElements = doc.querySelectorAll('item');
        const items: any[] = [];

        itemElements.forEach(el => {
            const encoded = el.getElementsByTagNameNS('http://purl.org/rss/1.0/modules/content/', 'encoded')[0];
            items.push({
                title: el.querySelector('title')?.textContent || '',
                link: el.querySelector('link')?.textContent || '',
                description: el.querySelector('description')?.textContent || '',
                content: encoded?.textContent || '',
                pubDate: el.querySelector('pubDate')?.textContent || new Date().toISOString()
            });
        });

        return items;
    }

    private generateId(input: string): string {
        // Simple hash-like ID from input string
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            hash = (hash << 5) - hash + input.charCodeAt(i);
            hash |= 0;
        }
        return `iblk-${Math.abs(hash).toString(36)}`;
    }
}
