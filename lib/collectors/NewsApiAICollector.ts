
import { BaseCollector, CollectorConfig } from './BaseCollector';
import { SupabaseClient } from '@supabase/supabase-js';
import { MonitorEvent, EventCategory, Severity } from '../../types';
import { getGeocodingService } from '../services/GeocodingService';
import axios from 'axios';

// newsAPI.ai (Event Registry) Collector
// Premium semantic search

const API_KEY = process.env.NEWSAPI_AI_KEY || '48555482-efe3-4f15-8a63-1ea93ede2012'; // Fallback to provided key if env missing

export class NewsApiAICollector extends BaseCollector {
    private geocoder = getGeocodingService();

    constructor(supabase: SupabaseClient) {
        const config: CollectorConfig = {
            name: 'NEWSAPI_AI',
            cacheDurationSeconds: 1800, // 30 mins (Limited credits)
            rateLimitPerMinute: 5,
            maxRetries: 3,
            circuitBreakerThreshold: 5,
            circuitBreakerTimeout: 3600
        };
        super(config, supabase);
    }

    protected async fetchData(): Promise<MonitorEvent[]> {
        if (!API_KEY) {
            console.warn('⚠️ NewsAPI.ai Key missing');
            return [];
        }

        const events: MonitorEvent[] = [];

        // Complex query for "End Times" themes
        const query = {
            "$query": {
                "$and": [
                    {
                        "$or": [
                            { "keyword": { "$or": ["War", "Military Conflict", "Terrorist Attack"] } },
                            { "keyword": { "$or": ["Persecution of Christians", "Religious Freedom"] } },
                            { "keyword": { "$or": ["Economic Collapse", "Cyber Attack", "Grid Failure"] } }
                        ]
                    },
                    { "lang": "eng" }
                ]
            },
            "$filter": {
                "isDuplicate": "skip",
                "startSourceRankPercentile": 0,
                "endSourceRankPercentile": 30 // Top 30% sources only
            }
        };

        try {
            console.log('🔍 Fetching from NewsAPI.ai...');
            const response = await axios.post('http://eventregistry.org/api/v1/article/getArticles', {
                "action": "getArticles",
                "query": query,
                "articlesPage": 1,
                "articlesCount": 20,
                "articlesSortBy": "date",
                "articlesSortByAsc": false,
                "apiKey": API_KEY,
                "resultType": "articles",
                "articlesArticleBodyLen": -1
            });

            const articles = response.data?.articles?.results || [];
            console.log(`📡 NewsAPI.ai: Found ${articles.length} articles`);

            for (const article of articles) {
                const title = article.title;
                const desc = article.body || article.sim; // summary or body
                const source = article.source?.title || 'NewsAPI.ai';

                const category = this.classifyCategory(title + ' ' + desc);
                const severity = this.classifySeverity(title + ' ' + desc);

                // Use AI Geocoding if high severity
                let location = 'Global';
                let coordinates = { lat: 0, lng: 0 };

                if (severity === 'CRITICAL' || severity === 'HIGH') {
                    try {
                        const geoRes = await this.geocoder.geocode({ text: title, priority: 'high' });
                        if (geoRes.success && geoRes.location) {
                            location = geoRes.location.name;
                            coordinates = { lat: geoRes.location.lat, lng: geoRes.location.lng };
                        }
                    } catch (e) { /* ignore */ }
                }

                events.push({
                    id: `newsapi_ai_${article.uri || Math.random().toString(36)}`,
                    title: title,
                    description: desc ? desc.substring(0, 500) : '',
                    category,
                    severity,
                    sourceType: 'NEWS_API',
                    sourceName: source,
                    sourceUrl: article.url,
                    timestamp: article.dateTime ? new Date(article.dateTime).toISOString() : new Date().toISOString(),
                    location,
                    coordinates
                });
            }

        } catch (error) {
            console.error('NewsAPI.ai Error:', error);
            throw error;
        }

        return events;
    }

    private classifyCategory(text: string): EventCategory {
        const t = text.toLowerCase();
        if (t.includes('christian') || t.includes('church') || t.includes('persecut')) return EventCategory.PERSECUTION;
        if (t.includes('war') || t.includes('missile') || t.includes('army')) return EventCategory.CONFLICT;
        if (t.includes('economic') || t.includes('bank') || t.includes('inflation')) return EventCategory.ECONOMIC;
        if (t.includes('cyber') || t.includes('hacker')) return EventCategory.CYBER;
        return EventCategory.POLITICAL;
    }

    private classifySeverity(text: string): Severity {
        const t = text.toLowerCase();
        if (t.includes('nuclear') || t.includes('genocide')) return 'CRITICAL';
        if (t.includes('kill') || t.includes('dead') || t.includes('attack')) return 'HIGH';
        return 'MEDIUM';
    }
}
