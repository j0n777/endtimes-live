import { SupabaseClient } from '@supabase/supabase-js';
import { BaseCollector } from './BaseCollector';
import { GDACSCollector } from './GDACSCollector';
import { NASAEONETCollector } from './NASAEONETCollector';
import { ACLEDCollector } from './ACLEDCollector';
import { NASAFIRMSCollector } from './NASAFIRMSCollector';
import { WHOCollector } from './WHOCollector';
import { GDELTCollector } from './GDELTCollector';
import { PolymarketCollector } from './PolymarketCollector';
import { TelegramCollector } from './TelegramCollector';
import { TwitterCollector } from './TwitterCollector';
import { WeatherNWSCollector } from './WeatherNWSCollector';
import { CyberAttacksCollector } from './CyberAttacksCollector';
import { VIXCollector } from './VIXCollector';
import { EmbassyCollector } from './EmbassyCollector';
import { InternetShutdownsCollector } from './InternetShutdownsCollector';
import { FlightCollector } from './FlightCollector';
import { AviationCollector } from './AviationCollector';
import { MaritimeCollector } from './MaritimeCollector';
// import { NewsRSSCollector } from './NewsRSSCollector'; // REPLACED
import { RegionalNewsCollector, MonitorRegion } from './RegionalNewsCollector';
import { NewsApiAICollector } from './NewsApiAICollector';
import { AskNewsCollector } from './AskNewsCollector';
import { YouTubeLiveCollector } from './YouTubeLiveCollector';
import { MonitorEvent } from '../../types';

/**
 * Orchestrates all data collectors
 * Runs them in parallel with proper error handling
 */
export class CollectorOrchestrator {
    private collectors: BaseCollector[];
    private supabase: SupabaseClient;

    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;

        // Initialize all collectors
        this.collectors = [
            // Core
            new GDACSCollector(supabase),
            new NASAEONETCollector(supabase),

            // Intelligence
            new PolymarketCollector(supabase),
            new WHOCollector(supabase),
            new GDELTCollector(supabase),

            // Regional Telegram Collectors (Specific Intel)
            new TelegramCollector(supabase, 'BRAZIL', ['g1_noticias', 'metropoles', 'midianinja', 'folha']),
            new TelegramCollector(supabase, 'SOUTH_AMERICA', ['infobae', 'mercopress', 'warzone593', 'latam_intel']),
            new TelegramCollector(supabase, 'EUROPE', ['disclosetv', 'bellumpacta_news', 'bellingcat', 'geopolitics_live']),
            new TelegramCollector(supabase, 'AFRICA', ['allafrica', 'africanews', 'sabcnews']),
            new TelegramCollector(supabase, 'RUSSIA_ASIA', ['intel_slava_z', 'rybar', 'rt_news', 'scmpnews']),
            new TelegramCollector(supabase, 'NORTH_AMERICA', ['insiderpaper', 'police_frequency', 'breaking911', 'disclosetv']),

            // Security/Tech
            new CyberAttacksCollector(supabase),
            new InternetShutdownsCollector(supabase),

            // Alerts
            new WeatherNWSCollector(supabase),
            new EmbassyCollector(supabase),
            new VIXCollector(supabase),

            // Transport
            new FlightCollector(),
            new AviationCollector(supabase),
            new MaritimeCollector(supabase),

            // Regional News (Staggered Groups)
            new RegionalNewsCollector(supabase, MonitorRegion.BRAZIL),
            new RegionalNewsCollector(supabase, MonitorRegion.SOUTH_AMERICA),
            new RegionalNewsCollector(supabase, MonitorRegion.EUROPE),
            new RegionalNewsCollector(supabase, MonitorRegion.NORTH_AMERICA),
            new RegionalNewsCollector(supabase, MonitorRegion.AFRICA),
            new RegionalNewsCollector(supabase, MonitorRegion.RUSSIA_ASIA),
            // new NewsRSSCollector(supabase), // DEPRECATED

            new NewsApiAICollector(supabase),
            new AskNewsCollector(supabase),

            // Social (Unstable)
            new TwitterCollector(supabase),

            // Video Intelligence
            new YouTubeLiveCollector(supabase),

            // Protected (Rate limits / API keys)
            new ACLEDCollector(supabase),
            new NASAFIRMSCollector(supabase),
        ];
    }

    /**
     * Run all collectors that are due for refresh
     * Default behavior: Runs everything parallel. 
     * Staggered logic should be called by the scheduler (main loop).
     */
    async runAllCollectors(): Promise<{
        total: number;
        successful: number;
        failed: number;
        totalEvents: number;
        results: Array<{
            collector: string;
            status: 'success' | 'error';
            eventCount: number;
            error?: string;
        }>;
    }> {
        console.log('🚀 Starting FULL data collection run...');

        // For Staggered Verification, we can also force run specific sets here if needed.
        // But assuming this is "Run All", we do parallel.

        return await this.executeCollectors(this.collectors);
    }

    /**
     * Helper to execute a list of collectors
     */
    private async executeCollectors(collectorsToRun: BaseCollector[]) {
        const startTime = Date.now();
        const results = await Promise.allSettled(
            collectorsToRun.map(async collector => {
                const collectorName = (collector as any).config.name;
                try {
                    const events = await collector.collect();
                    return {
                        collector: collectorName,
                        status: 'success' as const,
                        eventCount: events.length,
                        events
                    };
                } catch (error) {
                    return {
                        collector: collectorName,
                        status: 'error' as const,
                        eventCount: 0,
                        error: error instanceof Error ? error.message : 'Unknown error',
                        events: []
                    };
                }
            })
        );

        let totalEvents = 0;
        let successCount = 0;
        let errorCount = 0;
        const summary: any[] = [];

        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                const data = result.value;
                if (data.status === 'success') {
                    successCount++;
                    totalEvents += data.eventCount;
                    summary.push({
                        collector: data.collector,
                        status: 'success',
                        eventCount: data.eventCount
                    });
                } else {
                    errorCount++;
                    summary.push({
                        collector: data.collector,
                        status: 'error',
                        eventCount: 0,
                        error: data.error
                    });
                }
            } else {
                // Should not happen with Promise.allSettled
                errorCount++;
            }
        });

        const duration = Date.now() - startTime;
        console.log(`\n✅ Collection Batch complete in ${duration}ms: ${successCount} OK, ${errorCount} Fail`);

        return {
            total: collectorsToRun.length,
            successful: successCount,
            failed: errorCount,
            totalEvents,
            results: summary
        };
    }

    /**
     * Run Staggered Update Cycle
     * T+0: South America, Brazil
     * T+3: North America
     * T+6: Europe
     * T+9: Africa
     * T+12: Russia/Asia
     * Loop restarts every 15 min.
     */
    async runStaggeredCycle(minuteOffset: number) {
        // Group Collectors
        const groups: Record<number, string[]> = {
            0: ['NEWS_SOUTH_AMERICA', 'NEWS_BRAZIL', 'TELEGRAM_SOUTH_AMERICA', 'TELEGRAM_BRAZIL', 'GDACS', 'VIX_INDEX'], // Critical Local + Fast Alerts
            3: ['NEWS_NORTH_AMERICA', 'TELEGRAM_NORTH_AMERICA', 'POLYMARKET', 'AVIATION_HERALD'],
            6: ['NEWS_EUROPE', 'TELEGRAM_EUROPE', 'MARITIME_NEWS'],
            9: ['NEWS_AFRICA', 'TELEGRAM_AFRICA', 'WHO_OUTBREAKS', 'INTERNET_SHUTDOWNS'],
            12: ['NEWS_RUSSIA_ASIA', 'TELEGRAM_RUSSIA_ASIA', 'CYBER_ATTACKS', 'NASA_EONET'] // Deep intel
        };

        // Determine which group to run based on current minute modulo 15
        // Ideally this is called every minute, and we check if we match a slot.
        // Or passed explicit offset.

        // Find closest bucket
        const bucket = Object.keys(groups)
            .map(Number)
            .reduce((prev, curr) => Math.abs(curr - minuteOffset) < Math.abs(prev - minuteOffset) ? curr : prev);

        if (Math.abs(bucket - minuteOffset) > 1) {
            console.log(`⏳ No scheduled tasks for minute ${minuteOffset} (Next bucket: ${bucket})`);
            return;
        }

        const targetNames = groups[bucket];
        console.log(`🕒 Staggered Update [Minute ${minuteOffset}]: Running ${targetNames.join(', ')}`);

        const collectorsToRun = this.collectors.filter(c => targetNames.includes((c as any).config.name));

        if (collectorsToRun.length > 0) {
            await this.executeCollectors(collectorsToRun);
        }
    }

    /**
     * Run specific collector by name
     */
    async runCollector(collectorName: string): Promise<MonitorEvent[]> {
        const collector = this.collectors.find(
            c => (c as any).config.name === collectorName
        );

        if (!collector) {
            throw new Error(`Collector ${collectorName} not found`);
        }

        console.log(`🔄 Running collector: ${collectorName}`);
        return await collector.collect();
    }

    /**
     * Get status of all collectors
     */
    async getCollectorStatuses(): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('collector_status')
            .select('*')
            .order('enabled', { ascending: false })
            .order('last_success_at', { ascending: false });

        if (error) {
            console.error('Error fetching collector statuses:', error);
            return [];
        }

        return data || [];
    }

    /**
     * Enable/disable a collector
     */
    async setCollectorEnabled(collectorName: string, enabled: boolean): Promise<void> {
        const { error } = await this.supabase
            .from('collector_status')
            .update({ enabled })
            .eq('collector_name', collectorName);

        if (error) {
            throw new Error(`Failed to update collector: ${error.message}`);
        }

        console.log(`${enabled ? '✅' : '⏸️'} ${collectorName} ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Reset circuit breaker for a collector
     */
    async resetCircuitBreaker(collectorName: string): Promise<void> {
        const { error } = await this.supabase
            .from('collector_status')
            .update({
                circuit_open: false,
                circuit_open_until: null,
                consecutive_failures: 0
            })
            .eq('collector_name', collectorName);

        if (error) {
            throw new Error(`Failed to reset circuit breaker: ${error.message}`);
        }

        console.log(`🔄 ${collectorName} circuit breaker reset`);
    }

    /**
     * Log collection run to database (for monitoring)
     */
    private async logCollectionRun(summary: any): Promise<void> {
        try {
            // You could create a collection_runs table to track this
            // For now, just console log
            console.log('Collection Run Summary:', summary);
        } catch (error) {
            console.error('Failed to log collection run:', error);
        }
    }

    /**
     * Get collectors list
     */
    getCollectors(): BaseCollector[] {
        return this.collectors;
    }

    /**
     * Add a new collector dynamically
     */
    addCollector(collector: BaseCollector): void {
        this.collectors.push(collector);
        console.log(`➕ Added collector: ${(collector as any).config.name}`);
    }
}
