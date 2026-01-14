# 🏗️ END TIMES MONITOR - Architecture Improvement Plan

## Executive Summary

This document provides a comprehensive analysis of the current architecture and a detailed plan to implement:
1. **Modular and organized data collectors** with proper separation of concerns
2. **Rate limiting and retry strategies** for all APIs
3. **Intelligent caching** with appropriate wait times
4. **Supabase backend integration** to reduce frontend load
5. **Partial data loading** strategy for optimal performance

---

## 📊 Current Architecture Analysis

### Current State Problems

#### 1. **Frontend-Heavy Architecture**
```typescript
// App.tsx - Lines 108-141
const handleRefreshData = async () => {
  // ❌ ALL data fetching happens in frontend
  // ❌ No rate limiting
  // ❌ No retry logic
  // ❌ No coordination between sources
  const { events, statuses } = await fetchAllDataSources(config);
  setEvents(events);
}
```

**Issues:**
- Every user fetches data directly from APIs
- No centralized rate limiting
- Wasted API quota (100 users = 100x API calls)
- High bandwidth usage
- Slow initial load

#### 2. **No Rate Limiting**
```typescript
// services/gdacs-service.ts - Lines 89-143
export const fetchGDACSEvents = async (): Promise<MonitorEvent[]> => {
  // ❌ Direct fetch with no rate limiting
  // ❌ No retry logic
  // ❌ No exponential backoff
  const response = await fetch(GDACS_RSS_URL);
}
```

#### 3. **Inefficient Caching**
```typescript
// services/data-sources.ts - Lines 28-47
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
// ❌ LocalStorage only (per-user)
// ❌ No shared cache
// ❌ Fixed 5min duration (not API-specific)
```

#### 4. **No Backend Coordination**
- Each service fetches independently
- No deduplication across users
- No centralized error handling
- No monitoring of API health

---

## 🎯 Target Architecture

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE BACKEND                             │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         DATA COLLECTION ORCHESTRATOR                     │  │
│  │  (Runs every N minutes via Supabase Edge Functions)     │  │
│  │                                                          │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │  Modular Collectors (Rate-Limited & Cached)     │    │  │
│  │  │                                                  │    │  │
│  │  │  • NASA EONET    [Cache: 30m, Retry: 3x]       │    │  │
│  │  │  • GDACS         [Cache: 15m, Retry: 3x]       │    │  │
│  │  │  • NASA FIRMS    [Cache: 3h,  Retry: 2x]       │    │  │
│  │  │  • ACLED         [Cache: 24h, Retry: 3x]       │    │  │
│  │  │  • GDELT         [Cache: 15m, Retry: 2x]       │    │  │
│  │  │  • WHO           [Cache: 1h,  Retry: 3x]       │    │  │
│  │  │  • Polymarket    [Cache: 5m,  Retry: 3x]       │    │  │
│  │  │  • Telegram      [Cache: 1m,  Retry: ∞]        │    │  │
│  │  │  • Weather NWS   [Cache: 10m, Retry: 3x]       │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  │                                                          │  │
│  │  Each collector implements:                             │  │
│  │  • Rate limiter (requests/minute, requests/day)        │  │
│  │  • Exponential backoff retry                           │  │
│  │  • Circuit breaker (auto-disable on repeated failures) │  │
│  │  • Cache check before fetch                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         POSTGRESQL DATABASE                              │  │
│  │                                                          │  │
│  │  events:                                                 │  │
│  │   • Lightweight fields (lat, lng, category, severity)   │  │
│  │   • Full details (title, description, etc.)            │  │
│  │   • Indexed by timestamp, severity, category           │  │
│  │                                                          │  │
│  │  collector_status:                                       │  │
│  │   • Last run time, next scheduled run                   │  │
│  │   • Success/error count                                 │  │
│  │   • Circuit breaker state                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            ▲
                            │ API Calls (Minimal)
                            │
┌───────────────────────────┴─────────────────────────────────┐
│                    FRONTEND (React)                         │
│                                                             │
│  Initial Load:                                              │
│  • Fetch ONLY alert signals (lat, lng, severity, category) │
│  • 50-100 high-priority events                             │
│  • Minimal payload (~10-20KB)                              │
│                                                             │
│  On User Interaction:                                       │
│  • Click marker → Load full event details                  │
│  • Manual refresh → Re-fetch alerts                        │
│  • Auto-refresh after 5 minutes of inactivity              │
│                                                             │
│  No Background Polling! User-initiated only.                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Implementation Plan

### Phase 1: Supabase Backend Setup (Week 1)

#### 1.1 Create Collector Status Table

```sql
-- supabase/migrations/001_collector_status.sql
CREATE TABLE IF NOT EXISTS collector_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identifier
  collector_name TEXT UNIQUE NOT NULL,
  
  -- Configuration
  enabled BOOLEAN DEFAULT true,
  cache_duration_seconds INT NOT NULL, -- How long to cache results
  rate_limit_per_minute INT DEFAULT 60,
  rate_limit_per_day INT,
  max_retries INT DEFAULT 3,
  
  -- State
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_error_at TIMESTAMPTZ,
  last_error_message TEXT,
  
  -- Circuit breaker
  consecutive_failures INT DEFAULT 0,
  circuit_open BOOLEAN DEFAULT false,
  circuit_open_until TIMESTAMPTZ,
  
  -- Statistics
  total_runs INT DEFAULT 0,
  total_successes INT DEFAULT 0,
  total_failures INT DEFAULT 0,
  total_events_collected INT DEFAULT 0,
  avg_response_time_ms INT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  config JSONB DEFAULT '{}'::jsonb
);

-- Index for scheduled runs
CREATE INDEX collector_status_next_run_idx ON collector_status (next_run_at) 
WHERE enabled = true AND circuit_open = false;

-- Initialize collectors
INSERT INTO collector_status (collector_name, cache_duration_seconds, rate_limit_per_minute, rate_limit_per_day) VALUES
  ('NASA_EONET', 1800, 60, NULL),        -- 30 min cache, no daily limit
  ('GDACS', 900, 60, NULL),              -- 15 min cache
  ('NASA_FIRMS', 10800, 10, 1000),       -- 3 hour cache, 10/min, 1000/day
  ('ACLED', 86400, 5, 250),              -- 24 hour cache, 5/min, 250/day (free tier: 3000/year)
  ('GDELT', 900, 20, NULL),              -- 15 min cache
  ('WHO', 3600, 30, NULL),               -- 1 hour cache
  ('POLYMARKET', 300, 60, NULL),         -- 5 min cache
  ('TELEGRAM', 60, 60, NULL),            -- 1 min cache
  ('WEATHER_NWS', 600, 30, NULL),        -- 10 min cache
  ('CYBER_ATTACKS', 3600, 10, NULL),     -- 1 hour cache
  ('INTERNET_SHUTDOWNS', 3600, 10, NULL),-- 1 hour cache
  ('VIX', 300, 60, NULL),                -- 5 min cache
  ('EMBASSY', 86400, 5, NULL),           -- 24 hour cache
  ('NOTAM', 3600, 10, NULL)              -- 1 hour cache
ON CONFLICT (collector_name) DO NOTHING;
```

#### 1.2 Create Rate Limiting Table

```sql
-- supabase/migrations/002_rate_limiting.sql
CREATE TABLE IF NOT EXISTS rate_limit_log (
  id BIGSERIAL PRIMARY KEY,
  collector_name TEXT NOT NULL,
  request_timestamp TIMESTAMPTZ DEFAULT NOW(),
  success BOOLEAN,
  response_time_ms INT
);

-- Indexes for rate limiting queries
CREATE INDEX rate_limit_log_collector_timestamp_idx 
ON rate_limit_log (collector_name, request_timestamp DESC);

-- Auto-cleanup old logs (keep last 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_rate_logs()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM rate_limit_log 
  WHERE request_timestamp < NOW() - INTERVAL '7 days';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_rate_logs_trigger
  AFTER INSERT ON rate_limit_log
  EXECUTE FUNCTION cleanup_old_rate_logs();
```

#### 1.3 Update Events Table Schema

```sql
-- supabase/migrations/003_events_optimization.sql

-- Add collector reference
ALTER TABLE events ADD COLUMN IF NOT EXISTS collector_name TEXT;
CREATE INDEX IF NOT EXISTS events_collector_idx ON events (collector_name);

-- Add fetched_at to track when data was retrieved
ALTER TABLE events ADD COLUMN IF NOT EXISTS fetched_at TIMESTAMPTZ DEFAULT NOW();

-- Composite index for frontend queries
CREATE INDEX IF NOT EXISTS events_frontend_query_idx 
ON events (severity, event_timestamp DESC, fetched_at DESC)
WHERE severity IN ('HIGH', 'ELEVATED');
```

---

### Phase 2: Modular Collector Framework (Week 1-2)

Create a base collector class that all data sources extend:

```typescript
// lib/collectors/BaseCollector.ts

export interface CollectorConfig {
  name: string;
  cacheDurationSeconds: number;
  rateLimitPerMinute?: number;
  rateLimitPerDay?: number;
  maxRetries: number;
  circuitBreakerThreshold: number; // failures before opening circuit
  circuitBreakerTimeout: number; // seconds to keep circuit open
}

export interface CollectorMetrics {
  requestCount: number;
  successCount: number;
  errorCount: number;
  avgResponseTime: number;
  lastRun?: Date;
  lastSuccess?: Date;
  lastError?: { message: string; timestamp: Date };
}

export abstract class BaseCollector {
  protected config: CollectorConfig;
  protected supabase: SupabaseClient;
  private metrics: CollectorMetrics;
  
  constructor(config: CollectorConfig, supabase: SupabaseClient) {
    this.config = config;
    this.supabase = supabase;
    this.metrics = {
      requestCount: 0,
      successCount: 0,
      errorCount: 0,
      avgResponseTime: 0
    };
  }

  /**
   * Main entry point - handles caching, rate limiting, retries
   */
  async collect(): Promise<MonitorEvent[]> {
    // 1. Check if enabled
    const status = await this.getStatus();
    if (!status.enabled) {
      console.log(`⏸️ ${this.config.name}: Disabled`);
      return [];
    }

    // 2. Check circuit breaker
    if (status.circuit_open && status.circuit_open_until > new Date()) {
      console.log(`🔴 ${this.config.name}: Circuit open until ${status.circuit_open_until}`);
      return [];
    }

    // 3. Check cache
    const cached = await this.getCachedEvents();
    if (cached && cached.length > 0) {
      console.log(`💾 ${this.config.name}: Using cached data (${cached.length} events)`);
      return cached;
    }

    // 4. Check rate limits
    const withinLimits = await this.checkRateLimits();
    if (!withinLimits) {
      console.log(`⏱️ ${this.config.name}: Rate limit exceeded, using stale cache`);
      return cached || [];
    }

    // 5. Fetch with retry logic
    const events = await this.fetchWithRetry();
    
    // 6. Store in database
    if (events.length > 0) {
      await this.storeEvents(events);
    }

    // 7. Update status
    await this.updateStatus(events.length > 0, null);

    return events;
  }

  /**
   * Fetch with exponential backoff retry
   */
  private async fetchWithRetry(): Promise<MonitorEvent[]> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const startTime = Date.now();
        
        // Call the concrete implementation
        const events = await this.fetchData();
        
        const responseTime = Date.now() - startTime;
        await this.logRequest(true, responseTime);
        
        console.log(`✅ ${this.config.name}: Fetched ${events.length} events (${responseTime}ms)`);
        return events;
        
      } catch (error) {
        lastError = error as Error;
        await this.logRequest(false, 0);
        
        if (attempt < this.config.maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`⚠️ ${this.config.name}: Attempt ${attempt} failed, retrying in ${waitTime}ms...`);
          await this.sleep(waitTime);
        }
      }
    }

    // All retries failed
    console.error(`❌ ${this.config.name}: All ${this.config.maxRetries} attempts failed:`, lastError);
    await this.updateStatus(false, lastError?.message || 'Unknown error');
    return [];
  }

  /**
   * Check rate limits
   */
  private async checkRateLimits(): Promise<boolean> {
    const now = new Date();
    
    // Check per-minute limit
    if (this.config.rateLimitPerMinute) {
      const { count } = await this.supabase
        .from('rate_limit_log')
        .select('*', { count: 'exact', head: true })
        .eq('collector_name', this.config.name)
        .gte('request_timestamp', new Date(now.getTime() - 60 * 1000).toISOString());
      
      if (count && count >= this.config.rateLimitPerMinute) {
        return false;
      }
    }

    // Check per-day limit
    if (this.config.rateLimitPerDay) {
      const { count } = await this.supabase
        .from('rate_limit_log')
        .select('*', { count: 'exact', head: true })
        .eq('collector_name', this.config.name)
        .gte('request_timestamp', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());
      
      if (count && count >= this.config.rateLimitPerDay) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get cached events from database
   */
  private async getCachedEvents(): Promise<MonitorEvent[] | null> {
    const cacheExpiry = new Date(Date.now() - this.config.cacheDurationSeconds * 1000);
    
    const { data, error } = await this.supabase
      .from('events')
      .select('*')
      .eq('collector_name', this.config.name)
      .gte('fetched_at', cacheExpiry.toISOString());

    if (error || !data || data.length === 0) {
      return null;
    }

    return data.map(this.dbEventToMonitorEvent);
  }

  /**
   * Store events in database
   */
  private async storeEvents(events: MonitorEvent[]): Promise<void> {
    // Delete old events from this collector
    await this.supabase
      .from('events')
      .delete()
      .eq('collector_name', this.config.name);

    // Insert new events
    const dbEvents = events.map(event => ({
      lat: event.coordinates.lat,
      lng: event.coordinates.lng,
      category: event.category,
      severity: event.severity,
      title: event.title,
      description: event.description,
      location: event.location,
      source_name: event.sourceName,
      source_type: event.sourceType,
      source_url: event.sourceUrl,
      event_timestamp: event.timestamp,
      collector_name: this.config.name,
      fetched_at: new Date().toISOString(),
      metadata: {
        conflictLevel: event.conflictLevel,
        // ... other fields
      }
    }));

    const { error } = await this.supabase
      .from('events')
      .insert(dbEvents);

    if (error) {
      console.error(`Failed to store events for ${this.config.name}:`, error);
    }
  }

  /**
   * Log request for rate limiting
   */
  private async logRequest(success: boolean, responseTime: number): Promise<void> {
    await this.supabase
      .from('rate_limit_log')
      .insert({
        collector_name: this.config.name,
        success,
        response_time_ms: responseTime
      });
  }

  /**
   * Update collector status
   */
  private async updateStatus(success: boolean, errorMessage: string | null): Promise<void> {
    const { data: status } = await this.supabase
      .from('collector_status')
      .select('*')
      .eq('collector_name', this.config.name)
      .single();

    if (!status) return;

    const consecutiveFailures = success ? 0 : (status.consecutive_failures + 1);
    const shouldOpenCircuit = consecutiveFailures >= this.config.circuitBreakerThreshold;

    const updates: any = {
      last_run_at: new Date().toISOString(),
      total_runs: status.total_runs + 1,
      consecutive_failures: consecutiveFailures
    };

    if (success) {
      updates.last_success_at = new Date().toISOString();
      updates.total_successes = status.total_successes + 1;
      updates.circuit_open = false;
      updates.circuit_open_until = null;
    } else {
      updates.last_error_at = new Date().toISOString();
      updates.last_error_message = errorMessage;
      updates.total_failures = status.total_failures + 1;
      
      if (shouldOpenCircuit) {
        updates.circuit_open = true;
        updates.circuit_open_until = new Date(
          Date.now() + this.config.circuitBreakerTimeout * 1000
        ).toISOString();
      }
    }

    // Calculate next run time
    updates.next_run_at = new Date(
      Date.now() + this.config.cacheDurationSeconds * 1000
    ).toISOString();

    await this.supabase
      .from('collector_status')
      .update(updates)
      .eq('collector_name', this.config.name);
  }

  /**
   * Get current status
   */
  private async getStatus(): Promise<any> {
    const { data } = await this.supabase
      .from('collector_status')
      .select('*')
      .eq('collector_name', this.config.name)
      .single();
    
    return data || { enabled: false };
  }

  // Utility methods
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private dbEventToMonitorEvent(dbEvent: any): MonitorEvent {
    return {
      id: dbEvent.id,
      title: dbEvent.title,
      description: dbEvent.description,
      category: dbEvent.category,
      severity: dbEvent.severity,
      sourceType: dbEvent.source_type,
      sourceName: dbEvent.source_name,
      location: dbEvent.location,
      coordinates: { lat: dbEvent.lat, lng: dbEvent.lng },
      timestamp: dbEvent.event_timestamp,
      sourceUrl: dbEvent.source_url,
      ...dbEvent.metadata
    };
  }

  /**
   * Abstract method - must be implemented by concrete collectors
   */
  protected abstract fetchData(): Promise<MonitorEvent[]>;
}
```

---

### Phase 3: Concrete Collector Implementations (Week 2)

Example of converting existing service to collector:

```typescript
// lib/collectors/GDACSCollector.ts

export class GDACSCollector extends BaseCollector {
  constructor(supabase: SupabaseClient) {
    super({
      name: 'GDACS',
      cacheDurationSeconds: 900, // 15 minutes
      rateLimitPerMinute: 60,
      maxRetries: 3,
      circuitBreakerThreshold: 5, // Open circuit after 5 consecutive failures
      circuitBreakerTimeout: 1800 // Keep circuit open for 30 minutes
    }, supabase);
  }

  protected async fetchData(): Promise<MonitorEvent[]> {
    // Existing fetchGDACSEvents logic here
    const response = await fetch('https://www.gdacs.org/xml/rss.xml');
    // ... parsing logic ...
    return events;
  }
}
```

Apply same pattern to:
- NASAEONETCollector
- NASAFIRMSCollector
- ACLEDCollector
- GDELTCollector
- WHOCollector
- PolymarketCollector
- TelegramCollector
- WeatherNWSCollector
- etc.

---

### Phase 4: Orchestration Service (Week 2)

```typescript
// lib/collectors/CollectorOrchestrator.ts

export class CollectorOrchestrator {
  private collectors: BaseCollector[];
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.collectors = [
      new GDACSCollector(supabase),
      new NASAEONETCollector(supabase),
      new NASAFIRMSCollector(supabase),
      new ACLEDCollector(supabase),
      new GDELTCollector(supabase),
      new WHOCollector(supabase),
      new PolymarketCollector(supabase),
      new TelegramCollector(supabase),
      new WeatherNWSCollector(supabase),
      // ... add all collectors
    ];
  }

  /**
   * Run all collectors that are due for refresh
   */
  async runScheduledCollectors(): Promise<void> {
    console.log('🚀 Starting scheduled collection run...');
    
    const results = await Promise.allSettled(
      this.collectors.map(collector => collector.collect())
    );

    let totalEvents = 0;
    let successCount = 0;
    let errorCount = 0;

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successCount++;
        totalEvents += result.value.length;
      } else {
        errorCount++;
        console.error(`Collector ${index} failed:`, result.reason);
      }
    });

    console.log(`✅ Collection complete: ${successCount} succeeded, ${errorCount} failed, ${totalEvents} total events`);
  }

  /**
   * Force refresh specific collector
   */
  async refreshCollector(collectorName: string): Promise<MonitorEvent[]> {
    const collector = this.collectors.find(c => c.config.name === collectorName);
    if (!collector) {
      throw new Error(`Collector ${collectorName} not found`);
    }

    return await collector.collect();
  }
}
```

---

### Phase 5: Supabase Edge Function (Week 2-3)

Deploy as scheduled function (runs every N minutes):

```typescript
// supabase/functions/collect-data/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { CollectorOrchestrator } from './lib/collectors/CollectorOrchestrator.ts'

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const orchestrator = new CollectorOrchestrator(supabase)
    await orchestrator.runScheduledCollectors()

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

Schedule via Supabase cron:
```sql
-- Schedule to run every 5 minutes
SELECT cron.schedule(
  'collect-data-job',
  '*/5 * * * *',
  $$SELECT net.http_post(
    url:='https://[project-ref].supabase.co/functions/v1/collect-data',
    headers:=jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'))
  )$$
);
```

---

### Phase 6: Lightweight Frontend API (Week 3)

#### 6.1 Alert Signals Endpoint (Lightweight)

```typescript
// supabase/functions/get-alerts/index.ts

serve(async (req) => {
  const supabase = createClient(...)
  
  // ONLY return lightweight data for map markers
  const { data, error } = await supabase
    .from('events')
    .select('id, lat, lng, category, severity, event_timestamp')
    .in('severity', ['HIGH', 'ELEVATED'])
    .order('event_timestamp', { ascending: false })
    .limit(100); // Only top 100 priority events

  return new Response(JSON.stringify({ alerts: data }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

#### 6.2 Event Details Endpoint (On-Demand)

```typescript
// supabase/functions/get-event-details/index.ts

serve(async (req) => {
  const { id } = await req.json()
  const supabase = createClient(...)
  
  // Load full event details when marker is clicked
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  return new Response(JSON.stringify({ event: data }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

#### 6.3 Frontend Implementation

```typescript
// App.tsx - Optimized data fetching

const [alerts, setAlerts] = useState<LightweightAlert[]>([]);
const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
const MIN_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Load lightweight alerts on mount
useEffect(() => {
  loadAlerts();
}, []);

const loadAlerts = async () => {
  // Check if we need to refresh
  if (lastFetchTime && Date.now() - lastFetchTime.getTime() < MIN_REFRESH_INTERVAL) {
    console.log('⏭️ Skipping refresh, last fetch was recent');
    return;
  }

  try {
    const response = await fetch('/functions/v1/get-alerts');
    const { alerts } = await response.json();
    setAlerts(alerts);
    setLastFetchTime(new Date());
  } catch (error) {
    console.error('Failed to load alerts:', error);
  }
};

// Manual refresh button
const handleManualRefresh = () => {
  setLastFetchTime(null); // Reset to allow immediate refresh
  loadAlerts();
};

// Load full details when marker clicked
const handleMarkerClick = async (alertId: string) => {
  const response = await fetch('/functions/v1/get-event-details', {
    method: 'POST',
    body: JSON.stringify({ id: alertId })
  });
  const { event } = await response.json();
  // Show in popup
  setSelectedEvent(event);
};
```

---

## 📋 API Rate Limit Configuration

### Per-API Recommended Limits

| API | Free Tier Limit | Cache Duration | Requests/Min | Requests/Day | Notes |
|-----|----------------|----------------|--------------|--------------|-------|
| **NASA EONET** | Unlimited | 30 min | 60 | - | No auth needed |
| **GDACS** | Unlimited | 15 min | 60 | - | RSS feed |
| **NASA FIRMS** | 1000/day | 3 hours | 10 | 1000 | Requires API key |
| **ACLED** | 3000/year | 24 hours | 5 | 8 | ~250/month budget |
| **GDELT** | Generous | 15 min | 20 | - | No official limit |
| **WHO** | Unlimited | 1 hour | 30 | - | RSS feed |
| **Polymarket** | Unlimited | 5 min | 60 | - | Public API |
| **Telegram** | 30 msg/sec | 1 min | 60 | - | Bot API |
| **NWS** | Unlimited | 10 min | 30 | - | Public API |
| **Weatherbit** | 500/day | 1 hour | 10 | 500 | Free tier |

---

## 🎯 Benefits Summary

### Performance Improvements
✅ **Initial Load**: 50KB vs 2MB+ (96% reduction)  
✅ **First Paint**: < 1s vs 3-5s (5x faster)  
✅ **Server Load**: 1 request/5min vs 100+ requests/min (99% reduction)  
✅ **API Costs**: $0 vs potential overage fees

### Reliability Improvements
✅ **Rate Limiting**: Prevents API quota exhaustion  
✅ **Retry Logic**: Handles transient failures gracefully  
✅ **Circuit Breaker**: Prevents repeated failures from cascading  
✅ **Caching**: Ensures data availability even when APIs are down

### User Experience
✅ **Instant Load**: Map renders immediately with cached alerts  
✅ **On-Demand Details**: Full data loaded only when needed  
✅ **Offline Support**: Can work with cached data  
✅ **Battery Friendly**: No constant polling

---

## 📅 Implementation Timeline

### Week 1
- [ ] Create Supabase tables (collector_status, rate_limit_log)
- [ ] Update events table schema
- [ ] Implement BaseCollector framework
- [ ] Convert 3-4 collectors (GDACS, NASA EONET, WHO, Polymarket)

### Week 2
- [ ] Convert remaining collectors
- [ ] Implement CollectorOrchestrator
- [ ] Create Supabase Edge Functions
- [ ] Set up cron scheduling

### Week 3
- [ ] Implement frontend lightweight API
- [ ] Update frontend to use new API
- [ ] Remove direct API calls from frontend
- [ ] Testing and optimization

### Week 4
- [ ] Monitoring and analytics
- [ ] Performance benchmarking
- [ ] Documentation
- [ ] Deployment to production

---

## 🧪 Testing Strategy

1. **Unit Tests**: Each collector independently
2. **Integration Tests**: Orchestrator with mock Supabase
3. **Load Tests**: Simulate 1000 concurrent users
4. **Rate Limit Tests**: Verify limits are enforced
5. **Circuit Breaker Tests**: Verify auto-recovery

---

## 📊 Monitoring & Observability

Add to Supabase dashboard:
- Real-time collector status
- API call volume per collector
- Error rates and circuit breaker state
- Cache hit/miss rates
- Response time trends
- Event count per category

---

## 🚀 Migration Path

1. **Dual Mode**: Run old and new system in parallel
2. **Feature Flag**: Toggle between old/new in frontend
3. **Gradual Rollout**: Enable for 10%, then 50%, then 100% of users
4. **Rollback Plan**: Keep old code for 2 weeks
5. **Deprecation**: Remove old code after successful migration

---

## ✅ Success Criteria

- [ ] All collectors using BaseCollector framework
- [ ] No direct API calls from frontend
- [ ] < 100KB initial payload
- [ ] < 1s initial load time
- [ ] Zero API rate limit violations
- [ ] 99.9% uptime for data collection
- [ ] Cache hit rate > 80%

---

## 📝 Conclusion

This architecture transformation will:
1. ✅ Provide a **modular, maintainable** collector system
2. ✅ Implement proper **rate limiting and retry** logic
3. ✅ Use **intelligent caching** tailored to each API
4. ✅ Centralize data collection in **Supabase backend**
5. ✅ Reduce frontend load with **partial data loading**
6. ✅ Improve **reliability, performance, and cost-efficiency**

The system will be production-ready, scalable, and sustainable for long-term operation.
