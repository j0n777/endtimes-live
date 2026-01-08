export type Severity = 'HIGH' | 'ELEVATED' | 'MEDIUM' | 'LOW';

export enum EventCategory {
  CONFLICT = 'CONFLICT',
  NATURAL_DISASTER = 'NATURAL_DISASTER',
  PERSECUTION = 'PERSECUTION',
  ECONOMIC = 'ECONOMIC',
  PROPHETIC = 'PROPHETIC',
  PANDEMIC = 'PANDEMIC',
  GOVERNMENT = 'GOVERNMENT',
  TECHNOLOGY = 'TECHNOLOGY'
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
}

export interface RadioChannel {
  id: string;
  name: string;
  frequency: string;
  mode: 'FM' | 'AM' | 'USB' | 'LSB' | 'DIGITAL';
  band: 'HF' | 'VHF' | 'UHF';
  description: string;
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
  telegramApiId: string;
  telegramApiHash: string;
  telegramPhone: string;
  customChannels: string[]; // List of channel usernames
  // New API Keys
  newsApiKey?: string;      // Free tier available
  nasaApiKey?: string;      // Free
  acledApiKey?: string;     // Research (Free with approval)
}

export type ViewState = 'SITUATION_MAP' | 'SURVIVAL' | 'RADIO' | 'TIMELINE' | 'AI_INTEL' | 'LIVE_FEED' | 'ADMIN';