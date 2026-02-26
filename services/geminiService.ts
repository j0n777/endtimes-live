import { GoogleGenAI, Type } from "@google/genai";
import { MonitorEvent, EventCategory, ConflictLevel, SourceType } from '../types';
import { RSS_SOURCES } from '../constants';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to generate a random ID
const generateId = () => Math.random().toString(36).substr(2, 9);

export const fetchRealTimeEvents = async (customChannels: string[] = []): Promise<MonitorEvent[]> => {
  if (!apiKey) {
    console.warn("Gemini Service: No API Key found.");
    return [];
  }

  const feedsList = RSS_SOURCES.join(", ");
  const telegramTargeting = customChannels.length > 0
    ? `CRITICAL INSTRUCTION: Prioritize scanning these specific Telegram Channels via their public web views (site:t.me/s/): ${customChannels.map(c => '@' + c).join(', ')}.`
    : '';

  // Enhanced OSINT Prompt targeting specific blindspots
  const prompt = `
    ACT AS: Global Intelligence Analyst & OSINT Aggregator.
    MISSION: Perform a Deep Sector Scan for real-time conflicts, disasters, economic crises, and other major global events.
    
    TARGET FEEDS (Simulate fetching latest headlines from):
    ${feedsList}

    ${telegramTargeting}

    MANDATORY SECTOR SCANS:
    1. GEOPOLITICAL: High-tension borders, active kinetic engagements, major political shifts.
    2. NATURAL DISASTERS: Severe weather, earthquakes, wildfires, floods.
    3. ECONOMIC: Severe market crashes, hyperinflation, major supply chain disruptions.
    4. HEALTH/PANDEMIC: Disease outbreaks, severe health emergencies.
    5. CYBER/INFRASTRUCTURE: Major cyber attacks, critical infrastructure failures.

    OUTPUT REQUIREMENT:
    - Return exactly 25 distinct, high-priority events.
    - Prioritize events from the last 24 hours.
    - If specific "breaking" news isn't found for a sector, find the most recent significant incident (last 7 days).

    CLASSIFICATION RULES (Assign the most accurate Category):
    - CONFLICT: Wars, skirmishes, riots, military movements, terror attacks.
    - NATURAL_DISASTER: Earthquakes, storms, floods, extreme weather.
    - FIRES: Major wildfires or urban infernos.
    - EPIDEMIC: Disease outbreaks, health emergencies.
    - ECONOMIC: Market crashes, inflation spikes, severe supply issues.
    - PROPHETIC: Events with direct religious/prophetic significance.
    - PERSECUTION: Targeted religious or political persecution.
    - POLITICAL: Major elections, political instability, crippling sanctions.
    - HUMANITARIAN: Famine, mass displacement, aid crises.
    - CYBER: Large-scale hacks, internet blackouts.
    - AVIATION: Plane crashes, major airspace closures.
    - MARITIME: Ship blockades, piracy, maritime accidents.
    - INFRASTRUCTURE: Power grid failures, dam collapses.
    - ENVIRONMENTAL: Severe pollution events, ecological disasters.
    - OTHER: Events that do not fit above.

    STRICT JSON OUTPUT FORMAT:
    [
      {
        "title": "Headline",
        "description": "Who, what, where.",
        "category": "EVENT_CATEGORY_NAME",
        "severity": "HIGH",
        "conflictLevel": "STATE_WAR",
        "sourceType": "RSS",
        "sourceName": "Liveuamap",
        "location": "City, Country",
        "lat": 0.0,
        "lng": 0.0,
        "timestamp": "ISO String"
      }
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Pro model for complex classification and wider knowledge base
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], // Essential for live OSINT grounding
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { type: Type.STRING, enum: Object.keys(EventCategory) },
              severity: { type: Type.STRING, enum: ['HIGH', 'ELEVATED', 'MEDIUM', 'LOW'] },
              conflictLevel: { type: Type.STRING, enum: Object.keys(ConflictLevel) },
              sourceType: { type: Type.STRING, enum: Object.keys(SourceType) },
              sourceName: { type: Type.STRING },
              location: { type: Type.STRING },
              lat: { type: Type.NUMBER },
              lng: { type: Type.NUMBER },
              timestamp: { type: Type.STRING }
            },
            required: ['title', 'description', 'category', 'severity', 'conflictLevel', 'location', 'lat', 'lng', 'sourceType', 'sourceName']
          }
        }
      }
    });

    const data = JSON.parse(response.text || '[]');

    return data.map((item: any) => ({
      id: generateId(),
      title: item.title,
      description: item.description,
      category: item.category as EventCategory,
      severity: item.severity,
      conflictLevel: item.conflictLevel as ConflictLevel,
      sourceType: item.sourceType as SourceType,
      sourceName: item.sourceName || 'Unknown Source',
      location: item.location,
      coordinates: { lat: item.lat, lng: item.lng },
      timestamp: item.timestamp || new Date().toISOString()
    }));

  } catch (error) {
    console.error("OSINT Fetch Failed:", error);
    return [];
  }
};

export const analyzeSituation = async (events: MonitorEvent[], userQuery: string): Promise<string> => {
  if (!apiKey) return "SYSTEM ERROR: API KEY NOT DETECTED. UNABLE TO ACCESS NEURAL CORE.";

  const eventContext = events.slice(0, 15).map(e =>
    `[${e.sourceType}] ${e.conflictLevel}: ${e.title} (${e.location})`
  ).join('\n');

  const prompt = `
    SYSTEM: You are the Intelligence Command Core of the "End Times Monitor".
    MISSION: Provide tactical advice, predictive analysis, and prophetic context.
    
    INTEL FEED (SITREP):
    ${eventContext}

    USER QUERY: ${userQuery}

    INSTRUCTIONS:
    1. CASCADING EFFECTS ANALYSIS: For any identified threat, strictly identifying 2nd and 3rd order consequences (e.g., "Event X in Red Sea" -> "Shipping delays" -> "Global Inflation" -> "Civil Unrest in Import-dependent nations").
    2. Analyze the query using the specific conflict levels provided.
    3. Reference specific OSINT sources if available in the feed.
    4. Keep tone strictly professional, military, and alert.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "NO INTELLIGENCE AVAILABLE.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "COMMUNICATION FAILURE. NEURAL LINK SEVERED.";
  }
};