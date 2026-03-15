export type Severity = 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'MEDIUM' | 'LOW';

export enum EventCategory {
  CONFLICT = 'CONFLICT',
  NATURAL_DISASTER = 'NATURAL_DISASTER',
  FIRES = 'FIRES',
  EPIDEMIC = 'EPIDEMIC',
  PANDEMIC = 'PANDEMIC', // Legacy: use EPIDEMIC
  ECONOMIC = 'ECONOMIC',
  PROPHETIC = 'PROPHETIC',
  PERSECUTION = 'PERSECUTION',
  POLITICAL = 'POLITICAL',
  GOVERNMENT = 'GOVERNMENT', // Legacy: use POLITICAL
  HUMANITARIAN = 'HUMANITARIAN',
  CYBER = 'CYBER',
  TECHNOLOGY = 'TECHNOLOGY', // Legacy: use CYBER
  AVIATION = 'AVIATION',
  MARITIME = 'MARITIME',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  ENVIRONMENTAL = 'ENVIRONMENTAL',
  INTERNET_BLACKOUT = 'INTERNET_BLACKOUT',
  SOLAR_ALERT = 'SOLAR_ALERT',
  OTHER = 'OTHER'
}

// New Granular Classification
export enum ConflictLevel {
  STATE_WAR = 'STATE_WAR', // Country vs Country
  CIVIL_WAR = 'CIVIL_WAR', // Internal massive conflict
  MILITIA_ACTION = 'MILITIA_ACTION', // Non-state actors/Terror groups
  BORDER_SKIRMISH = 'BORDER_SKIRMISH', // Localized firing
  RIOT_UNREST = 'RIOT_UNREST', // Civil disobedience
  MILITARY_MOVEMENT = 'MILITARY_MOVEMENT', // Logistics/Posturing
  POLITICAL_THREAT = 'POLITICAL_THREAT', // Rhetoric/Sanctions
  POST_CONFLICT = 'POST_CONFLICT' // Recovery/Insurgency
}

export enum SourceType {
  RSS = 'RSS',
  TWITTER_OSINT = 'X_OSINT',
  TELEGRAM = 'TELEGRAM',
  OFFICIAL = 'GOV_OFFICIAL',
  AI_INFERRED = 'AI_ANALYSIS'
}

// Weather Alert Geometry for polygon rendering on map
export interface WeatherAlertGeometry {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][]; // GeoJSON format
}

export interface MonitorEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  severity: Severity;
  conflictLevel?: ConflictLevel; // Optional, mainly for CONFLICT category
  sourceType: SourceType;
  sourceName?: string; // e.g., "Reuters", "@WarMonitor", "IntelSlava"
  location: string;
  timestamp: string; // ISO date
  coordinates: { lat: number; lng: number };
  propheticReference?: string;
  sourceUrl?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  // Weather Alert specific fields
  alertGeometry?: WeatherAlertGeometry; // Polygon area for weather alerts
  eventType?: string; // Specific event type (e.g., "Tornado Warning")
  urgency?: string; // "Immediate", "Expected", "Future"
  parameters?: {
    windSpeed?: number; // km/h
    rainfall?: number;  // mm
  };
}

export type IARURegion = 'IARU_R1' | 'IARU_R2' | 'IARU_R3' | 'GLOBAL';
export type Continent = 'NORTH_AMERICA' | 'SOUTH_AMERICA' | 'EUROPE' | 'ASIA' | 'AFRICA' | 'OCEANIA' | 'ANTARCTICA' | 'GLOBAL';
export type RadioLicense = 'AMATEUR' | 'GMRS' | 'PMR446' | 'MARINE' | 'AVIATION' | 'CB' | 'WEATHER' | 'RAILROAD' | 'BROADCAST' | 'MONITORING' | 'NONE';

export interface RadioChannel {
  id: string;
  name: string;
  frequency: string;
  mode: 'FM' | 'AM' | 'USB' | 'LSB' | 'DIGITAL' | 'DSC';
  band: 'HF' | 'VHF' | 'UHF' | 'MF';
  description: string;
  region: IARURegion;
  continent: Continent;
  license: RadioLicense;
  network?: string; // Optional: e.g., "TAPRN", "SHARES", "HAMNET"
  restrictions?: string; // Optional: licensing requirements details
  notes?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface SurvivalGuide {
  id: string;
  title: string;
  category: 'WATER' | 'FOOD' | 'SECURITY' | 'MEDICAL' | 'COMMS' | 'ENERGY' | 'SKILLS';
  content: string; // Markdown supported
  checklist?: ChecklistItem[];
}

export interface ProphecyEvent {
  id: string;
  title: string;
  scripture: string;
  status: 'FULFILLED' | 'IN_PROGRESS' | 'PENDING';
  description: string;
}

export interface AdminConfig {
  // Telegram Bot Integration (Simplified)
  telegramBotToken?: string;        // Bot token from @BotFather
  telegramChannelIds: string[];     // Channel IDs to monitor (e.g., @channelname or -100123456789)

  // X/Twitter Intelligence
  twitterEnabled?: boolean;
  twitterKeywords?: string[];

  // Aviation Intelligence
  aviationEnabled?: boolean;

  // Legacy API Keys
  newsApiKey?: string;              // Free tier available
  nasaApiKey?: string;              // Free
  acledApiKey?: string;             // Research (Free with approval)

  // Phase 1 Data Sources
  gdacsEnabled?: boolean;           // Global Disaster Alert (No auth)
  nasaEonetApiKey?: string;         // NASA Earth Observatory (Optional key)
  acledEmail?: string;              // ACLED requires email + key
  whoEnabled?: boolean;             // WHO Disease Outbreak (No auth)
  gdeltEnabled?: boolean;           // GDELT Global Events (No auth)
  nasaFirmsApiKey?: string;         // NASA Fire tracking (Required key)

  // Polymarket Integration (Market Intelligence)
  polymarketEnabled?: boolean;      // Enable Polymarket prediction markets monitoring

  // Weather Alerts (Severe Weather Monitoring)
  nwsEnabled?: boolean;             // NWS Weather Alerts (No auth, US only)
  weatherbitApiKey?: string;        // Weatherbit API (Global coverage)
  weatherbitEnabled?: boolean;      // Enable Weatherbit alerts
}

export interface DataSourceStatus {
  name: string;
  status: 'active' | 'error' | 'disabled' | 'loading';
  lastFetch?: string;
  eventCount?: number;
  error?: string;
}

export type ViewState = 'SITUATION_MAP' | 'SURVIVAL' | 'RADIO' | 'TIMELINE' | 'AI_INTEL' | 'LIVE_FEED' | 'ADMIN';