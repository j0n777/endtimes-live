import { EventCategory } from './types';

/**
 * Color mapping for event categories
 * Used for map markers and legends
 */
export const CATEGORY_COLORS: Record<EventCategory, string> = {
    CONFLICT: '#ef4444',        // Red - Wars, armed conflicts
    NATURAL_DISASTER: '#f97316', // Orange - Earthquakes, hurricanes, floods
    FIRES: '#fbbf24',           // Yellow/Amber - Wildfires, thermal anomalies  
    PANDEMIC: '#a855f7',        // Purple - Disease outbreaks, health emergencies
    ECONOMIC: '#3b82f6',        // Blue - Financial crises, market crashes
    PROPHETIC: '#eab308',       // Gold - Jerusalem/Israel, prophetic events
    PERSECUTION: '#991b1b',     // Dark Red - Religious persecution
    TECHNOLOGY: '#06b6d4',      // Cyan - Tech threats, cyber events
    GOVERNMENT: '#6b7280',      // Gray - Political events
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
