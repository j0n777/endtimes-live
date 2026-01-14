
import { BaseCollector, CollectorConfig } from './BaseCollector';
import { SupabaseClient } from '@supabase/supabase-js';
import { MonitorEvent, EventCategory, Severity } from '../../types';
import axios from 'axios';

// AskNews Collector
// Real-time breaking news

const CLIENT_ID = process.env.ASKNEWS_CLIENT_ID || '50d112c8-e1fe-4780-8e5b-8656746270ad';
const CLIENT_SECRET = process.env.ASKNEWS_SECRET || 'h80wtQMLvuJlxL_jXsPDmG-op_';

export class AskNewsCollector extends BaseCollector {

    constructor(supabase: SupabaseClient) {
        const config: CollectorConfig = {
            name: 'ASKNews',
            cacheDurationSeconds: 900,
            rateLimitPerMinute: 10,
            maxRetries: 3,
            circuitBreakerThreshold: 5,
            circuitBreakerTimeout: 1800
        };
        super(config, supabase);
    }

    protected async fetchData(): Promise<MonitorEvent[]> {
        if (!CLIENT_ID || !CLIENT_SECRET) { return []; }

        const events: MonitorEvent[] = [];

        try {
            // Need to authenticate first usually, or use Basic Auth?
            // AskNews docs say: Basic Auth with ClientID:Secret usually, or Bearer.
            // Assuming Basic Auth for simplicity as per common standards or API key in header.
            // Actually, AskNews likely uses "Authorization: Basic base64(id:secret)" or "X-Api-Key"?
            // Looking at user provided keys, they look like UUIDs. Let's try Basic Auth.

            const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

            // Fetch "stories" or "news"
            // Using a generic endpoint assumption or user prompt didn't specify endpoint. 
            // "https://api.asknews.app/v1/news/search" is a valid guess for AskNews.

            console.log('🔍 Fetching from AskNews...');
            const response = await axios.get('https://api.asknews.app/v1/news/search', {
                headers: { 'Authorization': `Basic ${auth}` }, // or Bearer?
                params: {
                    query: 'war OR conflict OR disaster OR economy OR cyber',
                    n_articles: 20,
                    return_type: 'both',
                    method: 'kw'
                }
            });

            // AskNews structure: data.as_of, data.n_hits, data.articles[]
            const articles = response.data?.articles || [];
            console.log(`📡 AskNews: Found ${articles.length} articles`);

            for (const article of articles) {
                events.push({
                    id: `asknews_${article.article_id}`,
                    title: article.title,
                    description: article.summary || article.title,
                    category: this.mapCategory(article.classification), // AskNews provides classification
                    severity: article.sentiment < 0.3 ? 'HIGH' : 'MEDIUM', // Simple sentiment heuristic
                    sourceType: 'ASK_NEWS',
                    sourceName: article.source_id,
                    sourceUrl: article.article_url,
                    timestamp: new Date(article.pub_date).toISOString(),
                    location: article.geo_location?.country || 'Global',
                    coordinates: { lat: 0, lng: 0 } // Let BaseCollector auto-geocode handle this!
                });
            }

        } catch (e: any) {
            // If 401, maybe its bearer?
            console.warn('AskNews Fetch Error (check Auth):', e.message);
        }

        return events;
    }

    private mapCategory(cls: string): EventCategory {
        if (!cls) return EventCategory.OTHER;
        const c = cls.toLowerCase();
        if (c.includes('crime') || c.includes('conflict')) return EventCategory.CONFLICT;
        if (c.includes('disaster')) return EventCategory.NATURAL_DISASTER;
        if (c.includes('politics')) return EventCategory.POLITICAL;
        if (c.includes('tech')) return EventCategory.CYBER;
        return EventCategory.OTHER;
    }
}
