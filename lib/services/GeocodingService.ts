import { GoogleGenAI } from '@google/genai';
import { LocationData, GeocodingRequest, GeocodingResult } from '../types/StandardizedEvent';

/**
 * AI-Powered Geocoding Service
 * Uses Gemini AI to extract precise coordinates from text descriptions
 * Falls back to free geocoding APIs when AI is unavailable
 */

export class GeocodingService {
    private gemini: GoogleGenAI | null = null;
    private model: any;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
        if (apiKey) {
            this.gemini = new GoogleGenAI({ apiKey });
            this.model = this.gemini.models;
        } else {
            console.warn('⚠️ Gemini API key not found, geocoding will use fallback methods');
        }
    }

    /**
     * Main geocoding function with AI enhancement
     */
    async geocode(request: GeocodingRequest): Promise<GeocodingResult> {
        const startTime = Date.now();

        try {
            // Try AI-powered geocoding first (most accurate)
            if (this.gemini && request.priority !== 'low') {
                const aiResult = await this.geocodeWithAI(request);
                if (aiResult.success) {
                    return {
                        ...aiResult,
                        processingTime: Date.now() - startTime
                    };
                }
            }

            // Fallback to free geocoding APIs
            const fallbackResult = await this.geocodeWithNominatim(request);
            return {
                ...fallbackResult,
                processingTime: Date.now() - startTime
            };

        } catch (error) {
            console.error('Geocoding error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                processingTime: Date.now() - startTime
            };
        }
    }

    /**
     * AI-powered geocoding using Gemini
     * Extracts precise location from complex text descriptions
     */
    private async geocodeWithAI(request: GeocodingRequest): Promise<GeocodingResult> {
        if (!this.model) {
            return { success: false, error: 'AI model not initialized' };
        }

        const prompt = this.buildGeocodingPrompt(request);

        try {
            const result = await this.model.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt
            });

            const text = result.text || '';

            // Parse AI response (expecting JSON)
            const parsed = this.parseAIResponse(text);

            if (parsed && parsed.lat && parsed.lng) {
                const location: LocationData = {
                    lat: parsed.lat,
                    lng: parsed.lng,
                    accuracy: parsed.accuracy || 'city',
                    address: parsed.address,
                    street: parsed.street,
                    city: parsed.city,
                    region: parsed.region,
                    country: parsed.country || request.context?.country || 'Unknown',
                    countryCode: parsed.countryCode || 'XX',
                    geocodedBy: 'ai',
                    geocodingConfidence: parsed.confidence || 0.8,
                    originalLocationText: request.text
                };

                // Validate coordinates
                if (this.isValidCoordinate(location.lat, location.lng)) {
                    return { success: true, location };
                }
            }

            return { success: false, error: 'AI returned invalid coordinates' };

        } catch (error) {
            console.error('AI geocoding error:', error);
            return { success: false, error: 'AI geocoding failed' };
        }
    }

    /**
     * Fallback geocoding using Nominatim (OpenStreetMap)
     * Free, no API key required
     */
    private async geocodeWithNominatim(request: GeocodingRequest): Promise<GeocodingResult> {
        const query = encodeURIComponent(request.text);
        const countryParam = request.context?.country ? `&countrycodes=${request.context.country}` : '';

        const url = `https://nominatim.openstreetmap.org/search?q=${query}${countryParam}&format=json&limit=3&addressdetails=1`;

        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'EndTimesMonitor/1.0' // Required by Nominatim
                }
            });

            if (!response.ok) {
                throw new Error(`Nominatim API error: ${response.status}`);
            }

            const results = await response.json();

            if (!results || results.length === 0) {
                return { success: false, error: 'Location not found' };
            }

            // Use best result
            const best = results[0];
            const location: LocationData = {
                lat: parseFloat(best.lat),
                lng: parseFloat(best.lon),
                accuracy: this.determineAccuracy(best.type),
                address: best.display_name,
                street: best.address?.road,
                city: best.address?.city || best.address?.town || best.address?.village,
                region: best.address?.state,
                country: best.address?.country || 'Unknown',
                countryCode: best.address?.country_code?.toUpperCase() || 'XX',
                geocodedBy: 'api',
                geocodingConfidence: parseFloat(best.importance || '0.5'),
                originalLocationText: request.text
            };

            // Prepare alternatives
            const alternatives = results.slice(1).map((r: any) => ({
                lat: parseFloat(r.lat),
                lng: parseFloat(r.lon),
                accuracy: this.determineAccuracy(r.type),
                city: r.address?.city,
                country: r.address?.country || 'Unknown',
                countryCode: r.address?.country_code?.toUpperCase() || 'XX',
                geocodedBy: 'api' as const,
                geocodingConfidence: parseFloat(r.importance || '0.3'),
                originalLocationText: request.text
            }));

            return {
                success: true,
                location,
                alternatives: alternatives.length > 0 ? alternatives : undefined
            };

        } catch (error) {
            console.error('Nominatim geocoding error:', error);
            return { success: false, error: 'Geocoding API failed' };
        }
    }

    /**
     * Build prompt for AI geocoding
     */
    private buildGeocodingPrompt(request: GeocodingRequest): string {
        let prompt = `You are a precise geocoding expert. Extract the exact geographic coordinates from this text:

TEXT: "${request.text}"
`;

        if (request.context?.country) {
            prompt += `\nCONTEXT: This event is likely in ${request.context.country}`;
        }

        prompt += `

Extract the MOST SPECIFIC location mentioned. For example:
- If "downtown Kyiv, Ukraine" → Find Kyiv city center coordinates
- If "Main Street in Springfield" → Find that specific street
- If "apartment building on Baker Street, London" → Find Baker Street, London coordinates

Return ONLY a JSON object with this structure (no markdown, no explanation):
{
  "lat": <latitude as number>,
  "lng": <longitude as number>,
  "accuracy": "exact" | "street" | "city" | "region" | "country",
  "address": "<full address if possible>",
  "street": "<street name if mentioned>",
  "city": "<city name>",
  "region": "<state/province if known>",
  "country": "<country name>",
  "countryCode": "<ISO 3166-1 alpha-2 code>",
  "confidence": <0.0 to 1.0 how confident you are>
}

Be as precise as possible. If multiple locations are mentioned, choose the most specific one.`;

        return prompt;
    }

    /**
     * Parse AI response into structured data
     */
    private parseAIResponse(text: string): any {
        try {
            // Remove markdown code blocks if present
            const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            return JSON.parse(cleaned);
        } catch (error) {
            console.error('Failed to parse AI response:', text);
            return null;
        }
    }

    /**
     * Determine accuracy level from Nominatim type
     */
    private determineAccuracy(type: string): LocationData['accuracy'] {
        if (!type) return 'unknown';

        const t = type.toLowerCase();
        if (t.includes('house') || t.includes('building') || t.includes('address')) return 'exact';
        if (t.includes('street') || t.includes('road')) return 'street';
        if (t.includes('city') || t.includes('town') || t.includes('village')) return 'city';
        if (t.includes('state') || t.includes('province') || t.includes('region')) return 'region';
        if (t.includes('country')) return 'country';

        return 'city'; // Default
    }

    /**
     * Validate coordinates are within valid ranges
     */
    private isValidCoordinate(lat: number, lng: number): boolean {
        return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    }

    /**
     * Batch geocoding with rate limiting
     */
    async geocodeBatch(requests: GeocodingRequest[]): Promise<GeocodingResult[]> {
        const results: GeocodingResult[] = [];

        for (const request of requests) {
            const result = await this.geocode(request);
            results.push(result);

            // Rate limiting: wait 1 second between requests (Nominatim requirement)
            if (request !== requests[requests.length - 1]) {
                await this.sleep(1000);
            }
        }

        return results;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Singleton instance
let geocodingService: GeocodingService | null = null;

export function getGeocodingService(): GeocodingService {
    if (!geocodingService) {
        geocodingService = new GeocodingService();
    }
    return geocodingService;
}
