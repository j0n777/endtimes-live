import { EventCategory } from './types';

/**
 * Color mapping for event categories
 * Used for map markers and legends
 */
export const CATEGORY_COLORS: Record<EventCategory, string> = {
    CONFLICT: '#dc2626',        // Red - Wars, armed conflicts (keep red)
    NATURAL_DISASTER: '#ea580c', // Orange - Earthquakes, hurricanes (keep orange)
    FIRES: '#d97706',           // Amber - Wildfires (keep amber)
    PANDEMIC: '#a855f7',        // Purple - Disease outbreaks (keep purple)
    ECONOMIC: '#2563eb',        // Blue - Financial crises (keep blue)  
    PROPHETIC: '#d1a144',       // Biblical Gold - Jerusalem/Israel
    PERSECUTION: '#8b4513',     // Saddle Brown - Desert earth tone
    TECHNOLOGY: '#c19a6b',      // Desert Sand/Tan - Military sand
    GOVERNMENT: '#9d7e4f',      // Khaki/Tan - Military desert camo
};

/**
 * Category display names for legends
 */
export const CATEGORY_LABELS: Record<EventCategory, string> = {
    CONFLICT: 'War / Armed Conflict',
    NATURAL_DISASTER: 'Natural Disaster',
    FIRES: 'Wildfires / Fires',
    PANDEMIC: 'Health / Pandemic',
    ECONOMIC: 'Economic Crisis',
    PROPHETIC: 'Prophetic Events',
    PERSECUTION: 'Persecution',
    TECHNOLOGY: 'Technology / Cyber',
    GOVERNMENT: 'Government / Political',
};
