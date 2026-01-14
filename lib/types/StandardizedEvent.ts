/**
 * Standardized Event Data Structure
 * All collectors must output events in this format
 */

export interface StandardizedEvent {
    // Core identification
    id: string;
    source: string; // e.g., 'NASA_EONET', 'GDACS', 'ACLED'
    sourceUrl?: string;

    // Event details
    title: string;
    description: string;
    category: EventCategory;
    severity: EventSeverity;

    // Precise geocoding (REQUIRED)
    location: LocationData;

    // Temporal data
    timestamp: string; // ISO 8601
    detectedAt: string; // When we detected it
    expiresAt?: string; // If temporary event

    // Classification for frontend filtering
    priority: EventPriority; // 1-5 (1=critical, 5=low)
    tags: string[]; // e.g., ['military', 'humanitarian', 'natural']

    // Additional context
    metadata: EventMetadata;

    // Media
    media?: MediaAttachment[];

    // Related data for OSINT
    osint?: OSINTData;
}

export interface LocationData {
    // Precise coordinates (REQUIRED)
    lat: number;
    lng: number;
    accuracy: LocationAccuracy; // 'exact' | 'street' | 'city' | 'region' | 'country'

    // Hierarchical location info
    address?: string; // Full street address if available
    street?: string;
    city?: string;
    region?: string; // State/Province
    country: string;
    countryCode: string; // ISO 3166-1 alpha-2

    // Geocoding metadata
    geocodedBy: 'api' | 'ai' | 'manual' | 'source';
    geocodingConfidence: number; // 0-1
    originalLocationText?: string; // Raw text from source
}

export type LocationAccuracy =
    | 'exact'      // Specific building/address
    | 'street'     // Street level
    | 'city'       // City center
    | 'region'     // State/Province
    | 'country'    // Country centroid
    | 'unknown';   // Fallback

export enum EventCategory {
    NATURAL_DISASTER = 'NATURAL_DISASTER',
    CONFLICT = 'CONFLICT',
    FIRES = 'FIRES',
    EPIDEMIC = 'EPIDEMIC',
    ECONOMIC = 'ECONOMIC',
    POLITICAL = 'POLITICAL',
    HUMANITARIAN = 'HUMANITARIAN',
    CYBER = 'CYBER',
    AVIATION = 'AVIATION',
    MARITIME = 'MARITIME',
    INFRASTRUCTURE = 'INFRASTRUCTURE',
    ENVIRONMENTAL = 'ENVIRONMENTAL',
    OTHER = 'OTHER'
}

export type EventSeverity = 'LOW' | 'MEDIUM' | 'ELEVATED' | 'HIGH' | 'CRITICAL';

export type EventPriority = 1 | 2 | 3 | 4 | 5; // 1=most critical

export interface EventMetadata {
    // Source-specific data
    sourceEventId?: string;
    sourceCategory?: string;

    // Quantitative metrics
    affectedPopulation?: number;
    casualties?: number;
    economicImpact?: number; // USD
    magnitude?: number; // For earthquakes, etc.

    // Qualitative data
    actors?: string[]; // For conflicts
    organizations?: string[]; // Organizations involved

    // Verification
    verified: boolean;
    verificationSource?: string;
    confidence: number; // 0-1

    // AI processing
    aiProcessed: boolean;
    aiSummary?: string;
    aiTags?: string[];
}

export interface MediaAttachment {
    type: 'image' | 'video' | 'audio' | 'document';
    url: string;
    thumbnail?: string;
    caption?: string;
    source?: string;
}

export interface OSINTData {
    // Nearby cameras (for future OSINT)
    nearbyCameras?: CameraLocation[];

    // Military assets (if applicable)
    militaryAssets?: MilitaryAsset[];

    // Related news
    relatedNews?: NewsArticle[];

    // Social media mentions
    socialMentions?: number;

    // Satellite imagery
    satelliteImagery?: SatelliteImage[];
}

export interface CameraLocation {
    id: string;
    type: 'traffic' | 'security' | 'webcam' | 'other';
    url: string;
    lat: number;
    lng: number;
    distance: number; // meters from event
    description?: string;
    isPublic: boolean;
}

export interface MilitaryAsset {
    type: 'aircraft' | 'naval' | 'ground';
    identifier?: string; // Call sign, registration
    lat: number;
    lng: number;
    altitude?: number;
    heading?: number;
    speed?: number;
    timestamp: string;
    source: string;
}

export interface NewsArticle {
    title: string;
    url: string;
    source: string;
    publishedAt: string;
    relevance: number; // 0-1
}

export interface SatelliteImage {
    url: string;
    capturedAt: string;
    satellite: string;
    resolution: number; // meters per pixel
    cloudCover?: number; // 0-100
}

/**
 * Frontend Data Tiers
 * Different levels of data for different use cases
 */

// Tier 1: Lightweight - For initial map render (10-20KB)
export interface LightweightEvent {
    id: string;
    lat: number;
    lng: number;
    category: EventCategory;
    severity: EventSeverity;
    priority: EventPriority;
    timestamp: string;
}

// Tier 2: Standard - For event list/cards (50-100KB)
export interface StandardEvent extends LightweightEvent {
    title: string;
    location: {
        city?: string;
        country: string;
    };
    source: string;
    summary: string; // First 200 chars of description
}

// Tier 3: Full - Complete details (loaded on demand)
export type FullEvent = StandardizedEvent;

/**
 * Data sanitization helpers
 */

export interface SanitizationResult {
    success: boolean;
    event?: StandardizedEvent;
    errors?: string[];
    warnings?: string[];
}

export interface GeocindgRequest {
    text: string; // Location text to geocode
    context?: {
        country?: string;
        region?: string;
        language?: string;
    };
    priority: 'high' | 'normal' | 'low';
}

export interface GeocodingResult {
    success: boolean;
    location?: LocationData;
    alternatives?: LocationData[]; // If multiple matches
    error?: string;
    processingTime?: number;
}
