import { MonitorEvent, EventCategory, Severity } from '../types';

// VIX Index (CBOE Volatility Index) - "Fear Index"
// Measures market expected volatility
// Source: Yahoo Finance (free, no API key)

const VIX_API_URL = 'https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?interval=1d&range=1d';

interface YahooFinanceResponse {
    chart: {
        result: [{
            meta: {
                regularMarketPrice: number;
                previousClose: number;
                chartPreviousClose: number;
            };
            timestamp: number[];
            indicators: {
                quote: [{
                    close: number[];
                }];
            };
        }];
        error: any;
    };
}

const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * Determine severity based on VIX level
 * VIX Interpretation:
 * < 15: Low volatility (calm markets)
 * 15-20: Normal volatility
 * 20-30: Elevated fear (heightened uncertainty)
 * 30-40: High fear (crisis expected)
 * > 40: Extreme panic (major crisis)
 */
const determineVIXSeverity = (vix: number): Severity => {
    if (vix > 40) return 'HIGH'; // Extreme panic
    if (vix > 30) return 'HIGH'; // Crisis expected
    if (vix > 20) return 'ELEVATED'; // Heightened fear
    return 'MEDIUM'; // Normal (but we don't create events for this)
};

const getVIXDescription = (vix: number, change: number): string => {
    const changeText = change > 0 ? `↑ +${change.toFixed(2)}` : `↓ ${change.toFixed(2)}`;

    if (vix > 40) {
        return `EXTREME PANIC - Markets expect major crisis or catastrophe. VIX: ${vix.toFixed(2)} (${changeText})`;
    }
    if (vix > 30) {
        return `CRISIS MODE - High market fear indicates significant geopolitical or economic event expected. VIX: ${vix.toFixed(2)} (${changeText})`;
    }
    if (vix > 20) {
        return `ELEVATED UNCERTAINTY - Markets showing heightened concern. Potential crisis developing. VIX: ${vix.toFixed(2)} (${changeText})`;
    }
    return `Market volatility at ${vix.toFixed(2)} (${changeText})`;
};

/**
 * Fetch VIX Index data from Yahoo Finance
 * Only generates events when VIX > 20 (elevated fear or higher)
 */
export const fetchVIXEvents = async (): Promise<MonitorEvent[]> => {
    try {
        const response = await fetch(VIX_API_URL);

        if (!response.ok) {
            console.error(`VIX API error: ${response.status}`);
            return [];
        }

        const data: YahooFinanceResponse = await response.json();

        if (data.chart.error || !data.chart.result || data.chart.result.length === 0) {
            console.error('VIX API returned no data');
            return [];
        }

        const result = data.chart.result[0];
        const currentVIX = result.meta.regularMarketPrice;
        const previousClose = result.meta.previousClose;
        const change = currentVIX - previousClose;

        // Only create event if VIX is elevated (> 20)
        if (currentVIX <= 20) {
            return []; // Markets calm, no event needed
        }

        const severity = determineVIXSeverity(currentVIX);
        const description = getVIXDescription(currentVIX, change);

        return [{
            id: generateId(),
            title: `Market Fear Index: VIX at ${currentVIX.toFixed(2)}`,
            description,
            category: EventCategory.ECONOMIC,
            severity,
            sourceType: 'OFFICIAL' as const,
            sourceName: 'VIX Index (CBOE)',
            location: 'Global Markets',
            coordinates: {
                lat: 40.7128, // New York Stock Exchange
                lng: -74.0060
            },
            timestamp: new Date().toISOString(),
            sourceUrl: 'https://www.cboe.com/tradable_products/vix/',
        }];

    } catch (error) {
        console.error('VIX fetch error:', error);
        return [];
    }
};
