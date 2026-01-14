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
import { AviationCollector } from './AviationCollector';
import { MaritimeCollector } from './MaritimeCollector';
import { NewsRSSCollector } from './NewsRSSCollector';
import { NewsApiAICollector } from './NewsApiAICollector';
import { AskNewsCollector } from './AskNewsCollector';
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
            new TelegramCollector(supabase),

            // Security/Tech
            new CyberAttacksCollector(supabase),
            new InternetShutdownsCollector(supabase),

            // Alerts
            // new WeatherNWSCollector(supabase), // API issues (400) + redundant with GDACS
            new EmbassyCollector(supabase),
            new VIXCollector(supabase),

            // Transport
            new AviationCollector(supabase),
            new MaritimeCollector(supabase),

            // General News
            new NewsRSSCollector(supabase),
            new NewsApiAICollector(supabase),
            new AskNewsCollector(supabase),

            // Social (Unstable)
            new TwitterCollector(supabase),

            // Protected (Rate limits / API keys)
            new ACLEDCollector(supabase),
            new NASAFIRMSCollector(supabase),
        ];
    }

    /**
     * Run all collectors that are due for refresh
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
        console.log('🚀 Starting data collection run...');
        const startTime = Date.now();

        const results = await Promise.allSettled(
            this.collectors.map(async collector => {
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
                errorCount++;
                summary.push({
                    collector: `collector_${index}`,
                    status: 'error',
                    eventCount: 0,
                    error: result.reason?.message || 'Unknown error'
                });
            }
        });

        const duration = Date.now() - startTime;

        console.log(`\n✅ Collection complete in ${duration}ms:`);
        console.log(`   • ${successCount} succeeded`);
        console.log(`   • ${errorCount} failed`);
        console.log(`   • ${totalEvents} total events collected\n`);

        // Log summary to database
        await this.logCollectionRun({
            total: this.collectors.length,
            successful: successCount,
            failed: errorCount,
            totalEvents,
            duration,
            timestamp: new Date().toISOString()
        });

        return {
            total: this.collectors.length,
            successful: successCount,
            failed: errorCount,
            totalEvents,
            results: summary
        };
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
