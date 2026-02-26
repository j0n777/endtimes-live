export const STATIC_LOCATIONS: Record<string, { lat: number; lng: number }> = {
    // Regions
    'europe': { lat: 50.8503, lng: 4.3517 },
    'asia': { lat: 34.0479, lng: 100.6197 },
    'africa': { lat: -8.7832, lng: 34.5085 },
    'middle east': { lat: 29.2985, lng: 42.5510 },
    'north america': { lat: 54.5260, lng: -105.2551 },
    'south america': { lat: -8.7832, lng: -55.4915 },
    'antarctica': { lat: -82.8628, lng: 135.0000 },

    // Major Countries & Hotspots
    'ukraine': { lat: 48.3794, lng: 31.1656 },
    'russia': { lat: 61.5240, lng: 105.3188 },
    'moscow': { lat: 55.7558, lng: 37.6173 },
    'kyiv': { lat: 50.4501, lng: 30.5234 },
    'israel': { lat: 31.0461, lng: 34.8516 },
    'jerusalem': { lat: 31.7683, lng: 35.2137 },
    'tel aviv': { lat: 32.0853, lng: 34.7818 },
    'palestine': { lat: 31.9522, lng: 35.2332 },
    'gaza': { lat: 31.3547, lng: 34.3088 },
    'rafah': { lat: 31.2968, lng: 34.2435 },
    'iran': { lat: 32.4279, lng: 53.6880 },
    'tehran': { lat: 35.6892, lng: 51.3890 },
    'china': { lat: 35.8617, lng: 104.1954 },
    'beijing': { lat: 39.9042, lng: 116.4074 },
    'taiwan': { lat: 23.6978, lng: 120.9605 },
    'taipei': { lat: 25.0330, lng: 121.5654 },
    'north korea': { lat: 40.3399, lng: 127.5101 },
    'south korea': { lat: 35.9078, lng: 127.7669 },
    'syria': { lat: 34.8021, lng: 38.9968 },
    'damascus': { lat: 33.5138, lng: 36.2765 },
    'yemen': { lat: 15.5527, lng: 48.5164 },
    'houthi': { lat: 15.3694, lng: 44.1910 }, // Sana'a
    'lebanon': { lat: 33.8547, lng: 35.8623 },
    'beirut': { lat: 33.8938, lng: 35.5018 },
    'hezbollah': { lat: 33.2705, lng: 35.2038 }, // South Lebanon
    'iraq': { lat: 33.2232, lng: 43.6793 },
    'baghdad': { lat: 33.3152, lng: 44.3661 },
    'afghanistan': { lat: 33.9391, lng: 67.7100 },
    'kabul': { lat: 34.5553, lng: 69.2075 },
    'usa': { lat: 37.0902, lng: -95.7129 },
    'united states': { lat: 37.0902, lng: -95.7129 },
    'america': { lat: 37.0902, lng: -95.7129 },
    'washington': { lat: 38.8951, lng: -77.0364 },
    'new york': { lat: 40.7128, lng: -74.0060 },
    'germany': { lat: 51.1657, lng: 10.4515 },
    'berlin': { lat: 52.5200, lng: 13.4050 },
    'france': { lat: 46.2276, lng: 2.2137 },
    'paris': { lat: 48.8566, lng: 2.3522 },
    'uk': { lat: 55.3781, lng: -3.4360 },
    'britain': { lat: 55.3781, lng: -3.4360 },
    'london': { lat: 51.5074, lng: -0.1278 },
    'japan': { lat: 36.2048, lng: 138.2529 },
    'tokyo': { lat: 35.6762, lng: 139.6503 },
    'india': { lat: 20.5937, lng: 78.9629 },
    'pakistan': { lat: 30.3753, lng: 69.3451 },
    'turkey': { lat: 38.9637, lng: 35.2433 },
    'istanbul': { lat: 41.0082, lng: 28.9784 },
    'venezuela': { lat: 6.4238, lng: -66.5897 },
    'brazil': { lat: -14.2350, lng: -51.9253 },
    'sudan': { lat: 12.8628, lng: 30.2176 },
    'somalia': { lat: 5.1521, lng: 46.1996 },
    'nigeria': { lat: 9.0820, lng: 8.6753 },
    'mexico': { lat: 23.6345, lng: -102.5528 },

    // Organizations
    'nato': { lat: 50.879, lng: 4.426 }, // Brussels
    'eu ': { lat: 50.8503, lng: 4.3517 }, // Brussels
    'european union': { lat: 50.8503, lng: 4.3517 },
    'un ': { lat: 40.7489, lng: -73.9680 }, // NYC
    'united nations': { lat: 40.7489, lng: -73.9680 },
    'fed ': { lat: 38.8921, lng: -77.0241 }, // DC
    'central bank': { lat: 50.1109, lng: 8.6821 }, // ECB Frankfurt (generic approximation)
};

export function extractStaticLocation(text: string): { name: string; coords: { lat: number; lng: number } } | null {
    if (!text) return null;
    const q = text.toLowerCase();

    // Specific Overrides for precise logic
    if (q.includes('russia') && q.includes('nato')) {
        return { name: 'Russia-NATO Border', coords: { lat: 55.0, lng: 30.0 } };
    }
    if (q.includes('china') && q.includes('taiwan')) {
        return { name: 'Taiwan Strait', coords: { lat: 24.5, lng: 119.5 } };
    }

    // Sort keys by length (descending) to match longest phrases first (e.g., "New York" before "York")
    const keys = Object.keys(STATIC_LOCATIONS).sort((a, b) => b.length - a.length);

    for (const key of keys) {
        // Use word boundary check for short words to avoid false positives (e.g. "us" in "virus")
        if (key.length <= 3) {
            const regex = new RegExp(`\\b${key}\\b`, 'i');
            if (regex.test(q)) {
                return {
                    name: key.toUpperCase(),
                    coords: STATIC_LOCATIONS[key]
                };
            }
        } else {
            if (q.includes(key)) {
                return {
                    name: key.charAt(0).toUpperCase() + key.slice(1),
                    coords: STATIC_LOCATIONS[key]
                };
            }
        }
    }

    return null;
}
