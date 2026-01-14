# 🎯 Architecture Improvements - Quick Summary

## Problem Statement

Your codebase currently:
- ❌ Fetches all data on **frontend** (every user makes API calls)
- ❌ Has **no rate limiting** (risk of API quota exhaustion)
- ❌ Uses **LocalStorage caching** (not shared between users)
- ❌ **Refreshes too frequently** (can stress APIs)
- ❌ Loads **full event data** on every refresh (slow, heavy)

## Recommended Solution

### 🏗️ Core Architecture Changes

```
OLD: Frontend → APIs (every user, every 5min)
NEW: Supabase Backend → APIs (once per 5-30min) → Frontend (lightweight alerts)
```

### ✅ What You Get

1. **Modular Data Collectors**
   - Each API has its own collector class
   - Standardized error handling, retries, caching
   - Easy to add new sources

2. **Rate Limiting Per API**
   ```
   NASA FIRMS:  10 req/min, 1000/day (3h cache)
   ACLED:        5 req/min,  250/day (24h cache)
   GDACS:       60 req/min,       ∞ (15min cache)
   Polymarket:  60 req/min,       ∞ (5min cache)
   ```

3. **Smart Caching**
   - Cache duration based on data freshness needs
   - Shared cache in Supabase (one fetch serves all users)
   - Automatic cache invalidation

4. **Frontend Optimization**
   - **Initial load**: Only lightweight alerts (lat, lng, severity, category)
   - **Payload size**: ~10-20KB vs 2MB+ (99% reduction)
   - **On-demand**: Full event details loaded when marker clicked
   - **No polling**: Refreshes only on user click or after 5min inactivity

5. **Reliability**
   - Exponential backoff retries (3 attempts)
   - Circuit breaker (auto-disable failing sources)
   - Graceful degradation

---

## 📊 Current API Usage Analysis

Your .env.local.example shows these APIs:

| API | Current Status | Rate Limit Risk | Recommendation |
|-----|----------------|----------------|----------------|
| NASA FIRMS | ✅ Active | ⚠️ HIGH (1000/day limit) | Cache 3h, max 10/min |
| ACLED | ⚠️ Has key | ⚠️ CRITICAL (3000/year!) | Cache 24h, max 5/min |
| NASA EONET | ✅ Active | ✅ Low (unlimited) | Cache 30min |
| GDACS | ✅ Active | ✅ Low (unlimited) | Cache 15min |
| WHO | ✅ Active | ✅ Low (unlimited) | Cache 1h |
| GDELT | ✅ Active | ⚠️ Medium | Cache 15min |
| Polymarket | ✅ Active | ✅ Low | Cache 5min |
| NWS | ✅ Active | ✅ Low (unlimited) | Cache 10min |
| Weatherbit | ❌ Disabled | ⚠️ HIGH (500/day) | Cache 1h if enabled |

**ACLED is the biggest concern** - at 3000 requests/year, you can only make ~8 requests/day. Without rate limiting, you'll exhaust this in hours!

---

## 🚀 Implementation Phases

### Phase 1: Database Setup (2-3 hours)
```sql
-- Create tables for collector status and rate limiting
-- See ARCHITECTURE_PLAN.md sections 1.1-1.3
```

Files to create:
- `supabase/migrations/001_collector_status.sql`
- `supabase/migrations/002_rate_limiting.sql`
- `supabase/migrations/003_events_optimization.sql`

### Phase 2: Base Collector Framework (1 day)
- Create `lib/collectors/BaseCollector.ts`
- Handles: caching, rate limiting, retries, circuit breaker
- All collectors extend this base class

### Phase 3: Convert Existing Services (2-3 days)
Convert each service file to a collector:
- `services/gdacs-service.ts` → `lib/collectors/GDACSCollector.ts`
- `services/nasa-eonet-service.ts` → `lib/collectors/NASAEONETCollector.ts`
- `services/nasa-firms-service.ts` → `lib/collectors/NASAFIRMSCollector.ts`
- `services/acled-service.ts` → `lib/collectors/ACLEDCollector.ts`
- ... (all 14+ services)

### Phase 4: Orchestrator (1 day)
- Create `lib/collectors/CollectorOrchestrator.ts`
- Runs all collectors in parallel
- Aggregates results

### Phase 5: Supabase Edge Function (1 day)
- Create `supabase/functions/collect-data/index.ts`
- Schedule via cron to run every 5 minutes
- Calls orchestrator to refresh data

### Phase 6: Frontend API (1 day)
- Create `supabase/functions/get-alerts/index.ts` (lightweight)
- Create `supabase/functions/get-event-details/index.ts` (full data)
- Update `App.tsx` to use new APIs

### Phase 7: Testing & Rollout (2-3 days)
- Test each collector individually
- Load testing with mock users
- Gradual rollout with feature flag

**Total: ~2 weeks** for full implementation

---

## 💡 Immediate Quick Wins

While implementing the full solution, you can get immediate benefits:

### Quick Win #1: Add Simple Rate Limiting (1 hour)

```typescript
// utils/rateLimiter.ts
export class SimpleRateLimiter {
  private lastCall: Record<string, number> = {};
  
  canCall(key: string, minIntervalMs: number): boolean {
    const now = Date.now();
    const last = this.lastCall[key] || 0;
    
    if (now - last < minIntervalMs) {
      return false;
    }
    
    this.lastCall[key] = now;
    return true;
  }
}

// In data-sources.ts
const limiter = new SimpleRateLimiter();

if (!limiter.canCall('NASA_FIRMS', 6000)) { // Max 10/min = 6s interval
  return getCachedNASAFIRMS(); // Use cache
}
```

### Quick Win #2: Increase Cache Duration (5 minutes)

```typescript
// services/data-sources.ts
const CACHE_DURATIONS = {
  'NASA_FIRMS': 3 * 60 * 60 * 1000, // 3 hours (data updates slowly)
  'ACLED': 24 * 60 * 60 * 1000,     // 24 hours (CRITICAL: quota limit)
  'GDACS': 15 * 60 * 1000,          // 15 minutes
  'POLYMARKET': 5 * 60 * 1000,      // 5 minutes
  // ... others
};
```

### Quick Win #3: Reduce Initial Load (30 minutes)

```typescript
// App.tsx
const [events, setEvents] = useState<MonitorEvent[]>([]);

// Only load high-priority events on initial load
useEffect(() => {
  const cached = localStorage.getItem('monitor_events');
  if (cached) {
    const parsed = JSON.parse(cached);
    // ONLY show HIGH/ELEVATED severity initially
    const priority = parsed.filter(e => 
      e.severity === 'HIGH' || e.severity === 'ELEVATED'
    ).slice(0, 50); // Max 50 events
    setEvents(priority);
  }
}, []);
```

---

## 🎯 Recommended Immediate Action Plan

### This Week (Choose ONE):

**Option A: Quick Fixes** (If you need improvements NOW)
1. ✅ Add simple rate limiter (1 hour)
2. ✅ Increase cache durations (5 min)
3. ✅ Reduce initial event load (30 min)
4. ✅ Add ACLED protection (critical!)

**Option B: Start Full Migration** (If you have 2 weeks)
1. ✅ Create database migrations
2. ✅ Implement BaseCollector framework
3. ✅ Convert 2-3 high-priority collectors
4. ✅ Test and iterate

### My Recommendation: **Do Both!**

1. **Week 1**: Apply Quick Wins (Option A) to get immediate relief
2. **Week 2-3**: Implement full architecture (Option B) for long-term solution

---

## 📋 Detailed Implementation Guide

See `ARCHITECTURE_PLAN.md` for:
- Complete database schemas
- Full BaseCollector implementation
- Concrete collector examples
- Supabase Edge Function code
- Frontend API endpoints
- Testing strategy
- Migration guide

---

## 🚨 CRITICAL: ACLED Rate Limit

**Your ACLED API has a 3000 requests/year limit!**

Without protection:
- ❌ At current refresh rate (5min), you'll hit limit in **10 days**
- ❌ With 10 active users, you'll hit limit in **1 day**
- ❌ Once exceeded, ACLED data is lost for the rest of the year

**Immediate fix:**
```typescript
// services/acled-service.ts
const ACLED_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 HOURS

// Only fetch once per day
// This gives you: 3000 requests ÷ 365 days = ~8 requests/day budget
```

---

## 📊 Expected Results

### Before (Current)
- Initial load: 2-5 seconds
- Payload: 2MB+
- API calls: 100+ per user per hour
- Rate limit risk: ⚠️ HIGH
- Scalability: ❌ Poor (each user = full load)

### After (Full Implementation)
- Initial load: < 1 second
- Payload: 10-20KB (99% reduction)
- API calls: 1 per data source per cache period (shared)
- Rate limit risk: ✅ Protected
- Scalability: ✅ Excellent (1000 users = same backend load)

---

## ❓ Questions to Consider

1. **Which APIs are most critical?** (Prioritize these for migration)
2. **What's your user count target?** (Affects caching strategy)
3. **Do you have a Supabase project set up?** (Required for backend)
4. **What's your timeline?** (Quick wins vs full migration)
5. **Do you want to keep frontend-only mode?** (For local dev)

---

## 📞 Next Steps

1. **Review** `ARCHITECTURE_PLAN.md` (full technical details)
2. **Decide** on timeline (quick wins vs full migration)
3. **Set up** Supabase project if not already done
4. **Start** with database migrations
5. **Test** each collector as you build it

Let me know which approach you prefer and I can help implement it!
