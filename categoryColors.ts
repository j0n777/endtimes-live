import { EventCategory } from './types';

/**
 * Color mapping for event categories
 * Used for map markers and legends
 */
export const CATEGORY_COLORS: Record<EventCategory, string> = {
    [EventCategory.CONFLICT]: '#ef4444',         // Red-500
    [EventCategory.NATURAL_DISASTER]: '#f97316', // Orange-500
    [EventCategory.FIRES]: '#d97706',            // Amber-600
    [EventCategory.EPIDEMIC]: '#9333ea',         // Purple-600
    [EventCategory.PANDEMIC]: '#9333ea',         // Alias to EPIDEMIC
    [EventCategory.ECONOMIC]: '#16a34a',         // Green-600
    [EventCategory.PROPHETIC]: '#ca8a04',        // Yellow-600 (Gold)
    [EventCategory.PERSECUTION]: '#9a3412',      // Orange-900 (Brownish)
    [EventCategory.POLITICAL]: '#475569',        // Slate-600
    [EventCategory.GOVERNMENT]: '#475569',       // Alias to POLITICAL
    [EventCategory.HUMANITARIAN]: '#db2777',     // Pink-600
    [EventCategory.CYBER]: '#06b6d4',            // Cyan-500
    [EventCategory.TECHNOLOGY]: '#06b6d4',       // Alias to CYBER
    [EventCategory.AVIATION]: '#3b82f6',         // Blue-500
    [EventCategory.MARITIME]: '#1e3a8a',         // Blue-900
    [EventCategory.INFRASTRUCTURE]: '#6366f1',   // Indigo-500
    [EventCategory.ENVIRONMENTAL]: '#10b981',    // Emerald-500
    [EventCategory.OTHER]: '#94a3b8'             // Slate-400
};

/**
 * Category display names for legends
 */
export const CATEGORY_LABELS: Record<EventCategory, string> = {
    [EventCategory.CONFLICT]: 'Conflict & War',
    [EventCategory.NATURAL_DISASTER]: 'Natural Disaster',
    [EventCategory.FIRES]: 'Wildfires',
    [EventCategory.EPIDEMIC]: 'Health & Epidemic',
    [EventCategory.PANDEMIC]: 'Pandemic (Legacy)',
    [EventCategory.ECONOMIC]: 'Economic Crisis',
    [EventCategory.PROPHETIC]: 'Biblical Prophecy',
    [EventCategory.PERSECUTION]: 'Christian Persecution',
    [EventCategory.POLITICAL]: 'Political & Gov',
    [EventCategory.GOVERNMENT]: 'Government (Legacy)',
    [EventCategory.HUMANITARIAN]: 'Humanitarian Aid',
    [EventCategory.CYBER]: 'Cyber Security',
    [EventCategory.TECHNOLOGY]: 'Technology (Legacy)',
    [EventCategory.AVIATION]: 'Aviation Incident',
    [EventCategory.MARITIME]: 'Maritime Incident',
    [EventCategory.INFRASTRUCTURE]: 'Infrastructure',
    [EventCategory.ENVIRONMENTAL]: 'Environmental',
    [EventCategory.OTHER]: 'Other Events',
};

