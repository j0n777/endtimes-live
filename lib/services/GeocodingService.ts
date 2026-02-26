import axios from 'axios';
import { GoogleGenAI } from '@google/genai';
import { LocationData, GeocodingRequest, GeocodingResult } from '../types/StandardizedEvent';

/**
 * AI-Powered Geocoding Service
 * Uses Gemini AI and Z.ai (GLM) to extract precise coordinates from text descriptions
 * Falls back to free geocoding APIs when AI is unavailable
 */

const GEMINI_MODELS = [
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
    'gemini-3-flash-preview',
    'gemini-2.0-flash'
];

const ZAI_MODELS = [
    'GLM-4.7-Flash',
    'GLM-4.5-Flash'
];

// Rate limiting state
let lastZaiRequestTime = 0;
const ZAI_BASE_URL = 'https://api.z.ai/api/paas/v4/chat/completions';

export class GeocodingService {
    private gemini: GoogleGenAI | null = null;
    private zaiKey: string | null = null;

    constructor() {
        const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
        if (geminiKey) {
            this.gemini = new GoogleGenAI({ apiKey: geminiKey });
        } else {
            console.warn('⚠️ Gemini API key not found');
        }

        this.zaiKey = process.env.ZAI_API_KEY;
        if (!this.zaiKey) {
            console.warn('⚠️ Z.ai API key not found');
        }
    }

    /**
     * Main geocoding function with AI enhancement
     */
    async geocode(request: GeocodingRequest): Promise<GeocodingResult> {
        const startTime = Date.now();

        try {
            // 1. Try Gemini Models first
            if (this.gemini && request.priority !== 'low') {
                for (const modelName of GEMINI_MODELS) {
                    try {
                        const aiResult = await this.geocodeWithGemini(request, modelName);
                        if (aiResult.success) {
                            return { ...aiResult, processingTime: Date.now() - startTime };
                        }
                    } catch (e: any) {
                        console.warn(`Gemini (${modelName}) failed, trying next...`);
                        if (e?.message?.includes('429')) continue;
                    }
                }
            }

            // 2. Try Z.ai Models as Fallback
            if (this.zaiKey && request.priority !== 'low') {
                for (const modelName of ZAI_MODELS) {
                    try {
                        const zaiResult = await this.geocodeWithZai(request, modelName);
                        if (zaiResult.success) {
                            return { ...zaiResult, processingTime: Date.now() - startTime };
                        }
                    } catch (e) {
                        console.warn(`Z.ai (${modelName}) failed, trying next...`);
                    }
                }
            }

            // 3. Last Resort: Nominatim
            console.log('Falling back to Nominatim for:', request.text);
            const fallbackResult = await this.geocodeWithNominatim(request);
            return {
                ...fallbackResult,
                processingTime: Date.now() - startTime
            };

        } catch (error) {
            console.error('Final Geocoding failure chain:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                processingTime: Date.now() - startTime
            };
        }
    }

    /**
     * AI-powered geocoding using Gemini
     */
    private async geocodeWithGemini(request: GeocodingRequest, modelName: string): Promise<GeocodingResult> {
        if (!this.gemini) return { success: false, error: 'Gemini not initialized' };

        const prompt = this.buildGeocodingPrompt(request);

        // Usage for @google/genai SDK
        const result = await (this.gemini as any).models.generateContent({
            model: modelName,
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });

        const text = result.text || '';

        const parsed = this.parseAIResponse(text);
        return this.processAIResult(parsed, request, `gemini:${modelName}`);
    }

    /**
     * AI-powered geocoding using Z.ai (GLM)
     * Implements mandatory 30s delay between requests
     */
    private async geocodeWithZai(request: GeocodingRequest, modelName: string): Promise<GeocodingResult> {
        if (!this.zaiKey) return { success: false, error: 'Z.ai key missing' };

        // Mandatory 30s Delay
        const now = Date.now();
        const timeSinceLast = now - lastZaiRequestTime;
        if (timeSinceLast < 30000) {
            const waitTime = 30000 - timeSinceLast;
            console.log(`🕒 Z.ai Rate Limit Cooling: Waiting ${Math.ceil(waitTime / 1000)}s...`);
            await this.sleep(waitTime);
        }

        try {
            lastZaiRequestTime = Date.now();
            const response = await axios.post(ZAI_BASE_URL, {
                model: modelName,
                messages: [
                    { role: 'user', content: this.buildGeocodingPrompt(request) }
                ],
                temperature: 0.1
            }, {
                headers: {
                    'Authorization': `Bearer ${this.zaiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000 // Increased timeout further for GLM-4.5
            });

            const content = response.data.choices?.[0]?.message?.content || '';
            const parsed = this.parseAIResponse(content);
            return this.processAIResult(parsed, request, `zai:${modelName}`);
        } catch (error: any) {
            console.error(`Z.ai error (${modelName}):`, error?.response?.data || error.message);
            return { success: false, error: 'Z.ai request failed' };
        }
    }

    private processAIResult(parsed: any, request: GeocodingRequest, provider: string): GeocodingResult {
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

            if (this.isValidCoordinate(location.lat, location.lng)) {
                console.log(`✅ Geocoded by ${provider}: ${location.city || location.country}`);
                return { success: true, location };
            }
        }
        return { success: false, error: 'AI returned invalid coordinates' };
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
