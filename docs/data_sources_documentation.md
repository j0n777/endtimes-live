# 📡 END TIMES MONITOR - Data Sources Complete Documentation

## Current Implementation Architecture

### System Overview

```
┌─────────────────────────────────────────────────┐
│           DATA COLLECTION LAYER                 │
│  ┌──────────────┐         ┌──────────────┐     │
│  │  RSS Feeds   │         │  USGS API    │     │
│  │  (9 sources) │         │ (Earthquakes)│     │
│  └──────────────┘         └──────────────┘     │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│         PROCESSING & CLASSIFICATION             │
│  • NLP Keyword Detection (EN/PT)                │
│  • Severity Analysis                            │
│  • Category Assignment                          │
│  • Geolocation Extraction                       │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│         API AGGREGATION                         │
│  /api/events - Combines all sources             │
│  Cache: 5 minutes                               │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│         CLIENT PRESENTATION                     │
│  • Map Visualization                            │
│  • Filtering & Search                           │
│  • Event Timeline                               │
└─────────────────────────────────────────────────┘
```

---

## 📰 Current Data Sources

### 1. RSS Feeds (9 Active Sources)

#### Implementation Location
- File: `lib/rss-service.ts`
- Parser: `rss-parser` library
- Update Frequency: Every 5 minutes (via API cache)

#### Active Feeds

##### International News (4 sources)
```typescript
1. Reuters World News
   URL: https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best
   Category: CONFLICT
   Status: ❌ 404 Error (URL changed - needs update)
   
2. AP News
   URL: https://apnews.com/rss
   Category: CONFLICT
   Status: ❌ 404 Error (URL changed - needs update)
   
3. BBC World
   URL: https://feeds.bbci.co.uk/news/world/rss.xml
   Category: CONFLICT
   Status: ✅ Working
   
4. Al Jazeera
   URL: https://www.aljazeera.com/xml/rss/all.xml
   Category: CONFLICT
   Status: ✅ Working
```

##### Christian/Religious News (3 sources)
```typescript
5. Christian Post
   URL: https://www.christianpost.com/rss
   Category: PERSECUTION
   Status: ✅ Working
   
6. CBN News
   URL: https://www1.cbn.com/rss-cbn-articles-cbnnews
   Category: PERSECUTION
   Status: ⚠️ XML Parse Error (malformed)
   
7. Gospel Prime (Portuguese)
   URL: https://www.gospelprime.com.br/feed/
   Category: PERSECUTION
   Status: ✅ Working
```

##### Middle East/Prophetic (2 sources)
```typescript
8. Times of Israel
   URL: https://www.timesofisrael.com/feed/
   Category: PROPHETIC
   Status: ✅ Working
   
9. Jerusalem Post
   URL: https://www.jpost.com/rss/rssfeedsfrontpage.aspx
   Category: PROPHETIC
   Status: ✅ Working
```

#### RSS Feed Processing
```typescript
// Simplified flow
async function fetchRSSFeed(feed: RSSFeed): Promise<Event[]> {
  const parsedFeed = await parser.parseURL(feed.url);
  
  for (const item of parsedFeed.items) {
    // 1. Extract title and description
    // 2. Apply NLP classification
    const { category, severity } = classifyEvent(item.title, item.content);
    
    // 3. Generate approximate coordinates (MVP limitation)
    const coords = getApproximateCoordinates(category);
    
    // 4. Create Event object
    const event = {
      id, title, description,
      category, severity,
      latitude, longitude, location,
      source, url, publishedAt
    };
  }
}
```

---

### 2. USGS Earthquake API (Active)

#### Implementation
- File: `lib/api-service.ts`
- Endpoint: `https://earthquake.usgs.gov/fdsnws/event/1/query`
- Format: GeoJSON
- Authentication: ❌ None required (public API)

#### Configuration
```typescript
Parameters:
- format: 'geojson'
- starttime: Last 7 days
- endtime: Now
- minmagnitude: 4.0
- orderby: 'time'
```

#### Data Returned
- Earthquake magnitude
- Precise coordinates (lat/lng)
- Depth in kilometers
- Location description
- Felt reports count
- Timestamp
- Direct link to USGS page

#### Severity Classification
```typescript
if (magnitude >= 7.0) severity = 'HIGH';
else if (magnitude >= 6.0) severity = 'ELEVATED';
else if (magnitude >= 5.0) severity = 'MEDIUM';
else severity = 'LOW';
```

#### Current Results
- **78 earthquakes** currently visible on map
- Magnitude range: 4.0 - 7.5
- Global coverage
- Real-time updates

---

## 🤖 NLP Classification System

### Keyword-Based Detection (Multilingual EN/PT)

#### Categories & Keywords

```typescript
CONFLICT: [
  // English
  'war', 'attack', 'military', 'bombing', 'invasion', 
  'troops', 'combat', 'missile', 'strike', 'offensive',
  // Portuguese
  'guerra', 'ataque', 'militar', 'bombardeio', 'invasão', 'conflito'
]

DISASTER: [
  // English
  'earthquake', 'tsunami', 'hurricane', 'flood', 'volcano',
  'wildfire', 'storm', 'tornado', 'avalanche', 'landslide',
  // Portuguese
  'terremoto', 'furacão', 'inundação', 'vulcão', 'incêndio', 'tempestade'
]

PERSECUTION: [
  // English
  'christian', 'church', 'persecution', 'arrested', 'martyred',
  'religious', 'faith', 'believers', 'worship', 'banned',
  // Portuguese
  'cristão', 'igreja', 'perseguição', 'preso', 'mártir', 'religioso'
]

ECONOMIC: [
  // English
  'inflation', 'crisis', 'bank', 'collapse', 'recession',
  'unemployment', 'debt', 'default', 'bankruptcy',
  // Portuguese
  'inflação', 'crise', 'banco', 'colapso', 'recessão', 'desemprego'
]

PROPHETIC: [
  // English
  'israel', 'jerusalem', 'temple', 'middle east', 'prophecy',
  'biblical', 'covenant', 'peace treaty', 'gaza', 'west bank',
  // Portuguese
  'jerusalém', 'templo', 'oriente médio', 'profecia', 'bíblico'
]

PANDEMIC: [
  // English
  'pandemic', 'virus', 'outbreak', 'epidemic', 'disease',
  'health crisis', 'contagion', 'infection', 'quarantine',
  // Portuguese
  'pandemia', 'vírus', 'surto', 'epidemia', 'doença', 'crise sanitária'
]
```

#### Severity Keywords
```typescript
HIGH: [
  'major', 'severe', 'critical', 'emergency', 'deadly',
  'catastrophic', 'devastating', 'massive', 'unprecedented',
  'grande', 'severo', 'crítico', 'emergência', 'mortal'
]

ELEVATED: [
  'significant', 'serious', 'important', 'escalating', 'growing',
  'significativo', 'sério', 'importante', 'escalante'
]

MEDIUM: [
  'moderate', 'notable', 'considerable', 'developing',
  'moderado', 'notável', 'considerável'
]
```

---

## 🌍 FREE APIs TO ADD (Comprehensive List)

### 🌋 DISASTER & GEOLOGICAL APIs

#### 1. **GDACS - Global Disaster Alert and Coordination System**
```
URL: https://www.gdacs.org/
API: https://www.gdacs.org/xml/rss.xml
Format: RSS/XML
Auth: ❌ No
Cost: ✅ Free
Rate Limit: ✅ Unlimited

Coverage:
- Earthquakes (M5.0+)
- Tsunamis
- Tropical cyclones
- Floods
- Volcanoes

Severity Levels:
- Green (Advisory)
- Orange (Watch)
- Red (Warning)

Implementation: Simple XML parser
Priority: ⭐⭐⭐⭐⭐ HIGH
```

#### 2. **NASA EONET - Earth Observatory Natural Event Tracker**
```
URL: https://eonet.gsfc.nasa.gov/
API: https://eonet.gsfc.nasa.gov/api/v3/events
Format: JSON
Auth: ❌ No
Cost: ✅ Free
Rate Limit: ✅ Unlimited

Events:
- Wildfires
- Severe storms
- Volcanoes
- Sea/lake ice
- Floods
- Droughts
- Dust & haze
- Water color

Data Includes:
- Precise coordinates
- Date ranges
- Source links
- Satellite imagery

Priority: ⭐⭐⭐⭐⭐ HIGH
```

#### 3. **USGS Volcano Data**
```
URL: https://volcano.wr.usgs.gov/
API: https://volcano.wr.usgs.gov/volcanoes/index.json
Format: JSON
Auth: ❌ No
Cost: ✅ Free

Data:
- Active volcanoes
- Eruption status
- Alert levels
- Coordinates

Priority: ⭐⭐⭐⭐ MEDIUM
```

#### 4. **Open-Meteo Weather API**
```
URL: https://open-meteo.com/
API: https://api.open-meteo.com/v1/forecast
Format: JSON
Auth: ❌ No
Cost: ✅ Free (10,000 calls/day)

Data:
- Extreme weather warnings
- Hurricane tracking
- Temperature extremes
- Precipitation
- Wind speeds

Priority: ⭐⭐⭐ LOW (future enhancement)
```

---

### ⚔️ CONFLICT & WAR MONITORING APIs

#### 5. **ACLED - Armed Conflict Location & Event Data**
```
URL: https://acleddata.com/
API: https://api.acleddata.com/
Format: JSON
Auth: ✅ Required (Free tier: 3,000 req/year)
Cost: ✅ Free tier available

Coverage:
- Armed conflicts
- Protests
- Riots
- Strategic developments
- Violence against civilians

Data:
- Precise locations
- Fatalities
- Actor types
- Event descriptions

Refresh: Daily
Priority: ⭐⭐⭐⭐⭐ HIGH
```

#### 6. **GDELT Project - Global Database of Events, Language & Tone**
```
URL: https://www.gdeltproject.org/
API: https://api.gdeltproject.org/api/v2/doc/doc
Format: JSON
Auth: ❌ No
Cost: ✅ Free
Rate Limit: Generous

Coverage:
- Global news events
- Conflict monitoring
- Protest tracking
- Political events
- International relations

Update: Every 15 minutes
Data: 100+ languages
Priority: ⭐⭐⭐⭐ MEDIUM-HIGH
```

#### 7. **UN OCHA - Humanitarian Data Exchange**
```
URL: https://data.humdata.org/
API: https://data.humdata.org/api/3/action/package_search
Format: JSON
Auth: ❌ No (optional for higher limits)
Cost: ✅ Free

Data:
- Humanitarian crises
- Conflict zones
- Refugee movements
- Food security
- Health emergencies

Priority: ⭐⭐⭐⭐ MEDIUM-HIGH
```

---

### 📰 NEWS & MEDIA APIs

#### 8. **NewsAPI.org**
```
URL: https://newsapi.org/
API: https://newsapi.org/v2/everything
Format: JSON
Auth: ✅ API Key required
Cost: ✅ Free (100 req/day, 1000 results)
     💰 Paid: $449/month (unlimited)

Sources: 150,000+ from 50+ countries
Languages: Multi-language support
Search: Keywords, sources, dates

Useful For:
- Real-time news
- Keyword monitoring
- Source filtering

Limitation: Free tier is development only
Priority: ⭐⭐⭐ MEDIUM (consider paid)
```

#### 9. **MediaStack**
```
URL: https://mediastack.com/
API: http://api.mediastack.com/v1/news
Format: JSON
Auth: ✅ API Key required
Cost: ✅ Free (500 req/month)
     💰 Paid: $9.99/month (5,000 req)

Features:
- 7,500+ news sources
- Real-time news
- Historical data
- Multi-language

Priority: ⭐⭐⭐ MEDIUM
```

#### 10. **Currents API**
```
URL: https://currentsapi.services/
API: https://api.currentsapi.services/v1/
Format: JSON
Auth: ✅ API Key required
Cost: ✅ Free (600 req/day)

Sources: Global news
Languages: 20+ languages
Categories: Available

Priority: ⭐⭐⭐ MEDIUM
```

---

### 🛰️ SATELLITE & SPACE WEATHER APIs

#### 11. **NASA FIRMS - Fire Information for Resource Management**
```
URL: https://firms.modaps.eosdis.nasa.gov/
API: https://firms.modaps.eosdis.nasa.gov/api/
Format: JSON/CSV
Auth: ✅ API Key (free)
Cost: ✅ Free

Data:
- Active fires globally
- Thermal anomalies
- Near real-time (3-4 hours)
- Historical data

Priority: ⭐⭐⭐⭐ MEDIUM-HIGH
```

#### 12. **Space Weather API (NOAA)**
```
URL: https://www.swpc.noaa.gov/
API: https://services.swpc.noaa.gov/json/
Format: JSON
Auth: ❌ No
Cost: ✅ Free

Events:
- Solar flares
- Geomagnetic storms
- Coronal mass ejections
- Aurora forecasts

Prophetic Relevance: Signs in the heavens
Priority: ⭐⭐⭐ LOW-MEDIUM
```

---

### 🏥 HEALTH & PANDEMIC APIs

#### 13. **WHO Disease Outbreak News**
```
URL: https://www.who.int/
RSS: https://www.who.int/rss-feeds/news-english.xml
Format: RSS
Auth: ❌ No
Cost: ✅ Free

Coverage:
- Disease outbreaks
- Health emergencies
- Epidemic tracking

Priority: ⭐⭐⭐⭐ MEDIUM-HIGH
```

#### 14. **HealthMap API**
```
URL: https://www.healthmap.org/
API: Available on request
Format: JSON
Auth: ⚠️ Request needed
Cost: ✅ Free (academic/nonprofit)

Data:
- Disease alerts
- Outbreak tracking
- Global coverage

Priority: ⭐⭐⭐ MEDIUM
```

---

### ✝️ RELIGIOUS PERSECUTION TRACKING

#### 15. **Open Doors World Watch List**
```
URL: https://www.opendoorsusa.org/
API: ❌ No public API
Alternative: Web scraping (respectful)
Format: HTML → Parse
Cost: ✅ Free

Data:
- Persecution index by country
- Incident reports
- Trends

Implementation: Scheduled scraper
Priority: ⭐⭐⭐⭐ MEDIUM-HIGH
```

#### 16. **Voice of the Martyrs**
```
URL: https://www.persecution.com/
API: ❌ No public API
Alternative: RSS/Web scraping
Format: HTML/RSS
Cost: ✅ Free

Reports:
- Persecuted Christians
- Martyrdom accounts
- Country profiles

Priority: ⭐⭐⭐⭐ MEDIUM-HIGH
```

---

### 💰 ECONOMIC & FINANCIAL APIs

#### 17. **Forex & Crypto APIs**
```
CoinGecko API
URL: https://www.coingecko.com/api
Format: JSON
Auth: ❌ No (optional key for more)
Cost: ✅ Free (50 calls/min)

Alpha Vantage
URL: https://www.alphavantage.co/
Auth: ✅ API Key (free)
Cost: ✅ Free (500 req/day)

Coverage:
- Currency exchange rates
- Crypto prices
- Stock market data
- Economic indicators

Use Case: Detect economic collapse signs
Priority: ⭐⭐⭐ MEDIUM
```

---

## 🎯 RECOMMENDED IMPLEMENTATION PRIORITIES

### Phase 1 - Critical (Immediate)
1. ✅ **Fix broken RSS feeds** (Reuters, AP, CBN)
2. ⭐⭐⭐⭐⭐ **GDACS** - Comprehensive disaster alerts
3. ⭐⭐⭐⭐⭐ **NASA EONET** - Natural events tracking
4. ⭐⭐⭐⭐⭐ **ACLED** - Conflict data (registration needed)

### Phase 2 - High Value (Next 2 weeks)
5. ⭐⭐⭐⭐ **GDELT** - Global events database
6. ⭐⭐⭐⭐ **WHO Disease Outbreak News** - Health tracking
7. ⭐⭐⭐⭐ **NASA FIRMS** - Fire/thermal events
8. ⭐⭐⭐⭐ **UN OCHA** - Humanitarian crises

### Phase 3 - Enhanced Coverage (Month 2)
9. ⭐⭐⭐ **MediaStack** or **Currents API** - News aggregation
10. ⭐⭐⭐ **USGS Volcanoes** - Volcanic activity
11. ⭐⭐⭐ **Persecution tracking** - Open Doors scraping
12. ⭐⭐⭐ **Economic indicators** - Alpha Vantage

### Phase 4 - Premium Features (Future)
13. Consider NewsAPI paid tier for comprehensive news
14. Space weather monitoring
15. Crypto/economic collapse indicators

---

## 📊 API Comparison Table

| API | Auth | Cost | Rate Limit | Coverage | Priority |
|-----|------|------|------------|----------|----------|
| USGS Earthquakes | ❌ | Free | Unlimited | Global earthquakes | ⭐⭐⭐⭐⭐ |
| GDACS | ❌ | Free | Unlimited | Multi-disaster | ⭐⭐⭐⭐⭐ |
| NASA EONET | ❌ | Free | Unlimited | Natural events | ⭐⭐⭐⭐⭐ |
| ACLED | ✅ | Free tier | 3K/year | Conflicts | ⭐⭐⭐⭐⭐ |
| GDELT | ❌ | Free | Generous | Global events | ⭐⭐⭐⭐ |
| WHO RSS | ❌ | Free | Unlimited | Health | ⭐⭐⭐⭐ |
| NASA FIRMS | ✅ | Free | Good | Fires | ⭐⭐⭐⭐ |
| NewsAPI | ✅ | Free/Paid | 100/day | News | ⭐⭐⭐ |
| MediaStack | ✅ | Free/Paid | 500/month | News | ⭐⭐⭐ |
| Currents | ✅ | Free | 600/day | News | ⭐⭐⭐ |

---

## 🔧 TECHNICAL IMPLEMENTATION PLAN

### Step 1: Fix Current Issues
```bash
# Update RSS feed URLs
1. Find new Reuters RSS URL
2. Find new AP News RSS URL
3. Fix CBN News XML parsing

# Test all feeds
npm run test:feeds
```

### Step 2: Add GDACS (Immediate Win)
```typescript
// lib/gdacs-service.ts
export async function fetchGDACSEvents(): Promise<Event[]> {
  const response = await fetch('https://www.gdacs.org/xml/rss.xml');
  const xml = await response.text();
  
  // Parse XML to Event[]
  // Map severity: green=LOW, orange=ELEVATED, red=HIGH
  // Categories: earthquake, tsunami, cyclone, flood, volcano
}
```

### Step 3: Add NASA EONET
```typescript
// lib/nasa-service.ts
export async function fetchNASAEvents(): Promise<Event[]> {
  const response = await fetch(
    'https://eonet.gsfc.nasa.gov/api/v3/events?status=open'
  );
  const data = await response.json();
  
  // Map categories: wildfires, storms, volcanoes, etc.
  // Extract coordinates from geometry
}
```

### Step 4: Add ACLED (Requires signup)
```typescript
// .env.local
ACLED_API_KEY=your_key_here
ACLED_EMAIL=your_email@domain.com

// lib/acled-service.ts
export async function fetchACLEDEvents(): Promise<Event[]> {
  const params = {
    key: process.env.ACLED_API_KEY,
    email: process.env.ACLED_EMAIL,
    limit: 100,
    event_date_where: 'BETWEEN',
    event_date: // last 7 days
  };
  
  // Fetch conflict data
  // Categories: battles, explosions, violence, protests
}
```

### Step 5: Aggregate All Sources
```typescript
// app/api/events/route.ts
export async function GET() {
  const [
    rssEvents,
    earthquakes,
    gdacsEvents,
    nasaEvents,
    acledEvents,
    whoEvents
  ] = await Promise.all([
    fetchAllRSSFeeds(),
    fetchEarthquakes(),
    fetchGDACSEvents(),
    fetchNASAEvents(),
    fetchACLEDEvents(),
    fetchWHOEvents()
  ]);
  
  const allEvents = [
    ...rssEvents,
    ...earthquakes,
    ...gdacsEvents,
    ...nasaEvents,
    ...acledEvents,
    ...whoEvents
  ];
  
  // Deduplicate, sort, limit
  return NextResponse.json({ events: allEvents });
}
```

---

## 🚀 EXPECTED RESULTS AFTER FULL IMPLEMENTATION

### Current State
- **9 RSS feeds** (5-6 working)
- **1 API** (USGS Earthquakes)
- **~150-200 events** displayed
- **Categories**: All 6 covered but unevenly

### After Phase 1 (Week 1)
- **12 RSS feeds** (all fixed)
- **4 APIs** (USGS + GDACS + NASA + ACLED)
- **~500-800 events** displayed
- **Better coverage**: Disasters, conflicts, natural events

### After Phase 2 (Week 2-3)
- **15+ sources**
- **7-8 APIs**
- **~1000-1500 events**
- **Comprehensive coverage**: All categories well represented

### After Phase 3 (Month 2)
- **20+ sources**
- **10+ APIs**
- **2000+ events** with deduplication
- **Premium features**: Economic indicators, space weather

---

## 💡 BONUS INTEGRATIONS

### Telegram Bot (Already Planned)
```typescript
// Monitor specific channels
const channels = [
  '@earthquaketrack',
  '@militarylandnet', // War updates
  '@IntelDoge', // OSINT
  '@middle_east_spectator'
];
```

### Twitter/X API (Consider)
```
Cost: ~$100/month for basic tier
Value: Real-time breaking news
Priority: ⭐⭐⭐ MEDIUM (if budget allows)
```

### YouTube Data API
```
Monitor channels:
- News networks
- Christian channels
- Prophecy channels

Extract: Upload notifications, trending topics
Cost: Free (10,000 units/day)
Priority: ⭐⭐ LOW (future)
```

---

## 🎯 QUICK WIN CHECKLIST

To dramatically improve coverage TODAY:

1. [ ] Fix Reuters RSS URL
2. [ ] Fix AP News RSS URL
3. [ ] Fix CBN News parsing
4. [ ] Add GDACS (30 min implementation)
5. [ ] Add NASA EONET (45 min implementation)
6. [ ] Add WHO Disease Outbreak RSS (15 min)
7. [ ] Register for ACLED API key (5 min)
8. [ ] Implement ACLED integration (1 hour)

**Total Time**: ~3-4 hours
**Result**: 4x more events, much better coverage!

---

## 📝 FINAL RECOMMENDATIONS

### Must-Have (Free & High Value)
1. ✅ GDACS
2. ✅ NASA EONET
3. ✅ ACLED (free tier)
4. ✅ GDELT
5. ✅ WHO Outbreak News

### Nice-to-Have (Free)
6. NASA FIRMS (fires)
7. USGS Volcanoes
8. Open-Meteo (weather)
9. UN OCHA
10. Space Weather

### Consider Paid (High Value)
11. NewsAPI ($449/month) - Comprehensive news
12. Twitter/X API ($100/month) - Real-time breaking
13. MediaStack ($10/month) - Budget news API

### Future Exploration
14. Telegram monitoring
15. YouTube API
16. Economic indicators
17. Satellite imagery APIs

---

**This document provides complete foundation for expanding End Times Monitor into the most comprehensive prophetic event tracking system available!** 🌍⚠️📡
