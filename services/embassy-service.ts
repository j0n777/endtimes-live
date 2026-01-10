import { MonitorEvent, EventCategory, Severity } from '../types';

// U.S. State Department Travel Advisories
// Levels: 1=Normal, 2=Increased Caution, 3=Reconsider Travel, 4=Do Not Travel
// Source: travel.state.gov (RSS feed)

interface TravelAdvisory {
    country: string;
    level: number;
    date: string;
    description: string;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

// Approximate coordinates for countries (for visualization)
const COUNTRY_COORDS: Record<string, { lat: number; lng: number }> = {
    'Afghanistan': { lat: 33.9391, lng: 67.7100 },
    'Belarus': { lat: 53.9006, lng: 27.5590 },
    'Burma': { lat: 21.9162, lng: 95.9560 }, // Myanmar
    'Central African Republic': { lat: 6.6111, lng: 20.9394 },
    'Chad': { lat: 15.4542, lng: 18.7322 },
    'Haiti': { lat: 18.5944, lng: -72.3074 },
    'Iran': { lat: 35.6892, lng: 51.3890 },
    'Iraq': { lat: 33.3152, lng: 44.3661 },
    'Lebanon': { lat: 33.8547, lng: 35.8623 },
    'Libya': { lat: 26.3351, lng: 17.2283 },
    'Mali': { lat: 17.5707, lng: -3.9962 },
    'Nicaragua': { lat: 12.8654, lng: -85.2072 },
    'North Korea': { lat: 39.0392, lng: 125.7625 },
    'Palestine': { lat: 31.9522, lng: 35.2332 },
    'Russia': { lat: 55.7558, lng: 37.6173 },
    'Somalia': { lat: 5.1521, lng: 46.1996 },
    'South Sudan': { lat: 4.8594, lng: 31.5713 },
    'Sudan': { lat: 15.5007, lng: 32.5599 },
    'Syria': { lat: 33.5138, lng: 36.2765 },
    'Ukraine': { lat: 50.4501, lng: 30.5234 },
    'Venezuela': { lat: 10.4806, lng: -66.9036 },
    'Yemen': { lat: 15.5527, lng: 48.5164 },
};

/**
 * Get approximate coordinates for a country
 * Falls back to generic location if country not in database
 */
const getCountryCoordinates = (country: string): { lat: number; lng: number } => {
    return COUNTRY_COORDS[country] || { lat: 0, lng: 0 }; // Fallback
};

/**
 * Fetch State Department Travel Advisories
 * Currently using curated list of Level 3-4 countries
 * TODO: Integrate with actual State.gov API/RSS when available
 */
export const fetchEmbassyWarnings = async (): Promise<MonitorEvent[]> => {
    try {
        // Curated list of high-risk countries (Level 3-4)
        // Based on current State Department advisories
        // TODO: Replace with actual API call
        const highRiskCountries: TravelAdvisory[] = [
            // Level 4: Do Not Travel
            { country: 'Afghanistan', level: 4, date: new Date().toISOString(), description: 'Do Not Travel due to terrorism, civil unrest, kidnapping, and armed conflict.' },
            { country: 'Belarus', level: 4, date: new Date().toISOString(), description: 'Do Not Travel due to arbitrary enforcement of laws, risk of detention, and Ukraine conflict spillover.' },
            { country: 'Burma', level: 4, date: new Date().toISOString(), description: 'Do Not Travel due to civil unrest and armed conflict.' },
            { country: 'Central African Republic', level: 4, date: new Date().toISOString(), description: 'Do Not Travel due to crime, civil unrest, and kidnapping.' },
            { country: 'Haiti', level: 4, date: new Date().toISOString(), description: 'Do Not Travel due to kidnapping, crime, civil unrest, and limited healthcare.' },
            { country: 'Iran', level: 4, date: new Date().toISOString(), description: 'Do Not Travel due to risk of kidnapping, arbitrary arrest, and wrongful detention.' },
            { country: 'Iraq', level: 4, date: new Date().toISOString(), description: 'Do Not Travel due to terrorism, kidnapping, and armed conflict.' },
            { country: 'Libya', level: 4, date: new Date().toISOString(), description: 'Do Not Travel due to crime, terrorism, civil unrest, kidnapping, and armed conflict.' },
            { country: 'Mali', level: 4, date: new Date().toISOString(), description: 'Do Not Travel due to crime, terrorism, and kidnapping.' },
            { country: 'North Korea', level: 4, date: new Date().toISOString(), description: 'Do Not Travel due to serious risk of arrest and long-term detention.' },
            { country: 'Russia', level: 4, date: new Date().toISOString(), description: 'Do Not Travel due to the unpredictable consequences of the Ukraine conflict and risk of detention.' },
            { country: 'Somalia', level: 4, date: new Date().toISOString(), description: 'Do Not Travel due to crime, terrorism, civil unrest, and kidnapping.' },
            { country: 'South Sudan', level: 4, date: new Date().toISOString(), description: 'Do Not Travel due to crime, kidnapping, and armed conflict.' },
            { country: 'Sudan', level: 4, date: new Date().toISOString(), description: 'Do Not Travel due to armed conflict, civil unrest, crime, and kidnapping.' },
            { country: 'Syria', level: 4, date: new Date().toISOString(), description: 'Do Not Travel due to terrorism, civil unrest, kidnapping, and armed conflict.' },
            { country: 'Ukraine', level: 4, date: new Date().toISOString(), description: 'Do Not Travel due to active armed conflict.' },
            { country: 'Venezuela', level: 4, date: new Date().toISOString(), description: 'Do Not Travel due to crime, civil unrest, kidnapping, and wrongful detention.' },
            { country: 'Yemen', level: 4, date: new Date().toISOString(), description: 'Do Not Travel due to terrorism, civil unrest, kidnapping, and armed conflict.' },

            // Level 3: Reconsider Travel
            { country: 'Lebanon', level: 3, date: new Date().toISOString(), description: 'Reconsider Travel due to crime, terrorism, civil unrest, and kidnapping.' },
            { country: 'Nicaragua', level: 3, date: new Date().toISOString(), description: 'Reconsider Travel due to limited healthcare availability and arbitrary enforcement of laws.' },
            { country: 'Palestine', level: 3, date: new Date().toISOString(), description: 'Reconsider Travel due to terrorism and civil unrest.' },
            { country: 'Chad', level: 3, date: new Date().toISOString(), description: 'Reconsider Travel due to crime, terrorism, civil unrest, and kidnapping.' },
        ];

        return highRiskCountries.map(advisory => {
            const isLevel4 = advisory.level === 4;

            return {
                id: generateId(),
                title: `${isLevel4 ? '🚨 DO NOT TRAVEL' : '⚠️ RECONSIDER TRAVEL'}: ${advisory.country}`,
                description: advisory.description,
                category: isLevel4 ? EventCategory.CONFLICT : EventCategory.GOVERNMENT,
                severity: isLevel4 ? 'HIGH' as Severity : 'ELEVATED' as Severity,
                sourceType: 'OFFICIAL' as const,
                sourceName: 'U.S. State Department',
                location: advisory.country,
                coordinates: getCountryCoordinates(advisory.country),
                timestamp: advisory.date,
                sourceUrl: 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html',
            };
        });

    } catch (error) {
        console.error('Embassy warnings fetch error:', error);
        return [];
    }
};
