import {
    StandardizedEvent,
    LocationData,
    EventCategory,
    EventSeverity,
    EventPriority,
    EventMetadata,
    SanitizationResult
} from '../types/StandardizedEvent';
import { MonitorEvent } from '../../types';
import { getGeocodingService } from './GeocodingService';

/**
 * Data Sanitization Service
 * Converts any event format to StandardizedEvent with geocoding and enrichment
 */
export class DataSanitizationService {
    private geocoder = getGeocodingService();

    /**
     * Sanitize a MonitorEvent to StandardizedEvent
     */
    async sanitize(event: MonitorEvent, source: string): Promise<SanitizationResult> {
        const errors: string[] = [];
        const warnings: string[] = [];

        try {
            // 1. Basic validation
            if (!event.title || !event.category) {
                errors.push('Missing required fields: title or category');
                return { success: false, errors };
            }

            // 2. Geocode if location is imprecise or missing
            const location = await this.enhanceLocation(event, warnings);

            // 3. Determine priority
            const priority = this.determinePriority(event);

            // 4. Extract tags
            const tags = this.extractTags(event);

            // 5. Build metadata
            const metadata = this.buildMetadata(event);

            // 6. Create standardized event
            const standardized: StandardizedEvent = {
                id: event.id,
                source,
                sourceUrl: event.sourceUrl,

                title: event.title,
                description: event.description || '',
                category: event.category as EventCategory,
                severity: event.severity as EventSeverity,

                location,

                timestamp: event.timestamp,
                detectedAt: new Date().toISOString(),

                priority,
                tags,

                metadata
            };

            return {
                success: true,
                event: standardized,
                warnings: warnings.length > 0 ? warnings : undefined
            };

        } catch (error) {
            errors.push(error instanceof Error ? error.message : 'Unknown error');
            return { success: false, errors };
        }
    }

    /**
     * Enhance location with geocoding if needed
     */
    private async enhanceLocation(
        event: MonitorEvent,
        warnings: string[]
    ): Promise<LocationData> {

        // If we have precise coordinates already, use them
        if (event.coordinates &&
            event.coordinates.lat !== 0 &&
            event.coordinates.lng !== 0) {

            return {
                lat: event.coordinates.lat,
                lng: event.coordinates.lng,
                accuracy: this.determineAccuracyFromSource(event),
                city: this.extractCityFromLocation(event.location),
                country: this.extractCountryFromLocation(event.location),
                countryCode: 'XX', // Will be improved with reverse geocoding
                geocodedBy: 'source',
                geocodingConfidence: 0.9,
                originalLocationText: event.location
            };
        }

        // Need to geocode from text
        if (event.location) {
            const geocodeResult = await this.geocoder.geocode({
                text: event.location,
                priority: event.severity === 'HIGH' || event.severity === 'CRITICAL' ? 'high' : 'normal'
            });

            if (geocodeResult.success && geocodeResult.location) {
                return geocodeResult.location;
            } else {
                warnings.push(`Failed to geocode location: ${event.location}`);
            }
        }

        // Fallback: use coordinates even if (0,0)
        warnings.push('Using fallback coordinates');
        return {
            lat: event.coordinates?.lat || 0,
            lng: event.coordinates?.lng || 0,
            accuracy: 'unknown',
            country: 'Unknown',
            countryCode: 'XX',
            geocodedBy: 'manual',
            geocodingConfidence: 0,
            originalLocationText: event.location
        };
    }

    /**
     * Determine accuracy from source type
     */
    private determineAccuracyFromSource(event: MonitorEvent): LocationData['accuracy'] {
        const loc = event.location?.toLowerCase() || '';

        // Check for specific patterns
        if (loc.includes('street') || loc.includes('road') || loc.includes('avenue')) {
            return 'street';
        }

        if (loc.includes(',') && loc.split(',').length >= 2) {
            // Has city, country -> likely city level
            return 'city';
        }

        // Different sources have different precision
        switch (event.sourceName?.toUpperCase()) {
            case 'ACLED':
                return 'city'; // ACLED usually has city-level precision
            case 'GDACS':
            case 'NASA EONET':
            case 'NASA FIRMS':
                return 'exact'; // These have precise coordinates
            default:
                return 'city';
        }
    }

    /**
     * Extract city from location string
     */
    private extractCityFromLocation(location?: string): string | undefined {
        if (!location) return undefined;

        const parts = location.split(',').map(p => p.trim());
        if (parts.length >= 2) {
            return parts[0]; // First part is usually city
        }

        return undefined;
    }

    /**
     * Extract country from location string
     */
    private extractCountryFromLocation(location?: string): string {
        if (!location) return 'Unknown';

        const parts = location.split(',').map(p => p.trim());
        if (parts.length >= 2) {
            return parts[parts.length - 1]; // Last part is usually country
        }

        return location;
    }

    /**
     * Determine priority (1-5) based on severity and other factors
     */
    private determinePriority(event: MonitorEvent): EventPriority {
        // Base priority on severity
        let priority: number;

        switch (event.severity) {
            case 'CRITICAL':
                priority = 1;
                break;
            case 'HIGH':
                priority = 1;
                break;
            case 'ELEVATED':
                priority = 2;
                break;
            case 'MEDIUM':
                priority = 3;
                break;
            case 'LOW':
                priority = 4;
                break;
            default:
                priority = 5;
        }

        // Adjust based on category
        if (event.category === 'CONFLICT' || event.category === 'EPIDEMIC') {
            priority = Math.max(1, priority - 1) as EventPriority;
        }

        // Adjust based on conflict level (casualties)
        if (event.conflictLevel) {
            const casualties = this.extractCasualties(event.conflictLevel);
            if (casualties > 50) priority = 1;
            else if (casualties > 10) priority = Math.min(2, priority) as EventPriority;
        }

        return Math.max(1, Math.min(5, priority)) as EventPriority;
    }

    /**
     * Extract tags from event
     */
    private extractTags(event: MonitorEvent): string[] {
        const tags: Set<string> = new Set();

        // Category-based tags
        tags.add(event.category.toLowerCase().replace('_', '-'));

        // Severity tag
        tags.add(event.severity.toLowerCase());

        // Source type tag
        tags.add(event.sourceType.toLowerCase());

        // Extract from title and description
        const text = `${event.title} ${event.description || ''}`.toLowerCase();

        // Common keywords
        const keywords = [
            'military', 'civilian', 'humanitarian', 'emergency',
            'earthquake', 'tsunami', 'volcano', 'fire', 'flood',
            'explosion', 'attack', 'strike', 'bombing',
            'epidemic', 'outbreak', 'disease', 'pandemic',
            'protest', 'riot', 'violence', 'casualties',
            'infrastructure', 'evacuation', 'crisis'
        ];

        keywords.forEach(keyword => {
            if (text.includes(keyword)) {
                tags.add(keyword);
            }
        });

        // Add conflict level if present
        if (event.conflictLevel) {
            tags.add('casualties');
            const num = this.extractCasualties(event.conflictLevel);
            if (num > 10) tags.add('mass-casualties');
        }

        return Array.from(tags);
    }

    /**
     * Build metadata from event
     */
    private buildMetadata(event: MonitorEvent): EventMetadata {
        const casualties = event.conflictLevel ? this.extractCasualties(event.conflictLevel) : undefined;

        return {
            sourceEventId: event.id,
            sourceCategory: event.category,
            casualties,
            verified: event.sourceType === 'OFFICIAL', // Official sources are considered verified
            verificationSource: event.sourceType === 'OFFICIAL' ? event.sourceName : undefined,
            confidence: event.sourceType === 'OFFICIAL' ? 0.9 : 0.7,
            aiProcessed: false, // Will be set to true if AI processes this
        };
    }

    /**
     * Extract number of casualties from text
     */
    private extractCasualties(text: string): number {
        const match = text.match(/(\d+)\s*(fatalities|casualties|deaths|killed)/i);
        return match ? parseInt(match[1]) : 0;
    }

    /**
     * Batch sanitization
     */
    async sanitizeBatch(
        events: MonitorEvent[],
        source: string
    ): Promise<SanitizationResult[]> {
        const results: SanitizationResult[] = [];

        for (const event of events) {
            const result = await this.sanitize(event, source);
            results.push(result);
        }

        return results;
    }

    /**
     * Get summary statistics
     */
    getSanitizationStats(results: SanitizationResult[]): {
        total: number;
        successful: number;
        failed: number;
        warnings: number;
    } {
        return {
            total: results.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            warnings: results.filter(r => r.warnings && r.warnings.length > 0).length
        };
    }
}

// Singleton instance
let sanitizationService: DataSanitizationService | null = null;

export function getDataSanitizationService(): DataSanitizationService {
    if (!sanitizationService) {
        sanitizationService = new DataSanitizationService();
    }
    return sanitizationService;
}
