import { BaseCollector, CollectorConfig } from './BaseCollector';
import { SupabaseClient } from '@supabase/supabase-js';
import { MonitorEvent, EventCategory, Severity } from '../../types';

// Yahoo Finance API (unofficial endpoint)
const VIX_API_URL = 'https://query1.finance.yahoo.com/v8/finance/chart/^VIX?interval=1d&range=1d';

interface YahooFinanceResponse {
    chart: {
        result: Array<{
            meta: {
                regularMarketPrice: number;
                previousClose: number;
                symbol: string;
            };
            timestamp: number[];
        }>;
        error: any;
    };
}

/**
 * VIX Collector - Market Fear Index
 * Source: Yahoo Finance
 * Data: CBOE Volatility Index (VIX)
 */
export class VIXCollector extends BaseCollector {
    constructor(supabase: SupabaseClient) {
        const config: CollectorConfig = {
            name: 'VIX',
            cacheDurationSeconds: 300, // 5 minutes
            rateLimitPerMinute: 60,
            maxRetries: 3
        };
        super(config, supabase);
    }

    protected async fetchData(): Promise<MonitorEvent[]> {
        const response = await fetch(VIX_API_URL, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        if (!response.ok) throw new Error(`Yahoo API error: ${response.status}`);

        const data: YahooFinanceResponse = await response.json();

        if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
            throw new Error('Invalid VIX data structure');
        }

        const result = data.chart.result[0];
        const price = result.meta.regularMarketPrice;

        console.log(`📉 VIX Index: ${price}`);

        // Only return event if VIX is high (above 20 is alert, above 30 is panic)
        // Actually, always return it so we can show "Market Sentiment: Calm" too?
        // The requirement is usually for threats. Let's return if > 20 or if significant jump.

        if (price < 15) return []; // Calm market, no event needed maybe? Or keep generic. 
        // Let's return one event representing the market state.

        const severity = this.determineSeverity(price);

        return [{
            id: `vix-${Date.now()}`,
            title: `Market Volatility Index (VIX) at ${price.toFixed(2)}`,
            description: `CBOE VIX Index is ${price.toFixed(2)}. ${this.getAnalysis(price)}`,
            category: EventCategory.ECONOMIC,
            severity: severity,
            sourceType: 'MARKET',
            sourceName: 'Yahoo Finance',
            location: 'Global (Markets)',
            coordinates: { lat: 40.7128, lng: -74.0060 }, // NYC (Wall St)
            timestamp: new Date().toISOString(),
            sourceUrl: 'https://finance.yahoo.com/quote/^VIX'
        }];
    }

    private determineSeverity(price: number): Severity {
        if (price >= 40) return 'CRITICAL'; // 2020 crash level
        if (price >= 30) return 'HIGH'; // High fear
        if (price >= 20) return 'ELEVATED'; // Concern
        return 'MEDIUM'; // Normalish
    }

    private getAnalysis(price: number): string {
        if (price >= 30) return 'Markets are in extreme fear state. High crash probability.';
        if (price >= 20) return 'Markets showing increased volatility and uncertainty.';
        return 'Market sentiment is relatively calm.';
    }
}
