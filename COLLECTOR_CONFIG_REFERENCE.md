# 🔧 Data Collector Configuration Reference

## Quick Reference: Cache & Rate Limits

### 📊 Recommended Settings Per API

| API Source | Cache Duration | Requests/Min | Requests/Day | Update Frequency | Priority |
|------------|----------------|--------------|--------------|------------------|----------|
| **NASA EONET** | 30 minutes | 60 | Unlimited | Every 30-60 min | ⭐⭐⭐⭐⭐ |
| **GDACS** | 15 minutes | 60 | Unlimited | Every 15-30 min | ⭐⭐⭐⭐⭐ |
| **NASA FIRMS** | 3 hours | 10 | 1,000 | Every 3-6 hours | ⭐⭐⭐⭐ |
| **ACLED** | 24 hours | 5 | 8 | Once per day | ⭐⭐⭐⭐⭐ |
| **GDELT** | 15 minutes | 20 | Unlimited | Every 15-30 min | ⭐⭐⭐⭐ |
| **WHO** | 1 hour | 30 | Unlimited | Every 1-2 hours | ⭐⭐⭐⭐ |
| **Polymarket** | 5 minutes | 60 | Unlimited | Every 5-10 min | ⭐⭐⭐ |
| **Telegram** | 1 minute | 60 | Unlimited | Every 1-2 min | ⭐⭐⭐ |
| **Weather NWS** | 10 minutes | 30 | Unlimited | Every 10-20 min | ⭐⭐⭐⭐ |
| **Cyber Attacks** | 1 hour | 10 | Unlimited | Every 1-2 hours | ⭐⭐⭐ |
| **Internet Shutdowns** | 1 hour | 10 | Unlimited | Every 1-2 hours | ⭐⭐⭐ |
| **VIX** | 5 minutes | 60 | Unlimited | Every 5-10 min | ⭐⭐ |
| **Embassy** | 24 hours | 5 | Unlimited | Once per day | ⭐⭐⭐ |
| **NOTAM** | 1 hour | 10 | Unlimited | Every 1-2 hours | ⭐⭐ |
| **Geofence** | N/A | N/A | N/A | Client-side only | ⭐⭐ |
| **Heatmap** | N/A | N/A | N/A | Computed on client | ⭐⭐ |
| **POI** | 24 hours | 10 | Unlimited | Once per day | ⭐⭐ |

---

## 🚨 Critical: ACLED Configuration

**ACLED has the strictest limits - requires special handling!**

### Annual Limit Breakdown
- **Total**: 3,000 requests per year
- **Daily Budget**: ~8 requests per day (3000 ÷ 365)
- **Hourly Budget**: ~0.3 requests per hour
- **Recommended**: 1 request every 3 hours OR 1 request per day

### Configuration
```typescript
const ACLEDConfig = {
  cacheDurationSeconds: 86400,        // 24 hours (MANDATORY)
  rateLimitPerMinute: 1,              // 1 request max per minute
  rateLimitPerDay: 8,                 // 8 requests max per day
  rateLimitPerYear: 3000,             // Hard limit
  maxRetries: 2,                      // Less retries to save quota
  circuitBreakerThreshold: 3,
  circuitBreakerTimeout: 7200         // 2 hours
}
```

### Monitoring ACLED Usage
```sql
-- Query to track ACLED usage
SELECT 
  DATE(request_timestamp) as date,
  COUNT(*) as requests,
  COUNT(*) FILTER (WHERE success = true) as successful
FROM rate_limit_log
WHERE collector_name = 'ACLED'
  AND request_timestamp > NOW() - INTERVAL '30 days'
GROUP BY DATE(request_timestamp)
ORDER BY date DESC;

-- Yearly usage
SELECT COUNT(*) as yearly_usage,
       3000 - COUNT(*) as remaining_quota
FROM rate_limit_log
WHERE collector_name = 'ACLED'
  AND request_timestamp > DATE_TRUNC('year', NOW());
```

---

## ⚡ NASA FIRMS Configuration

**Daily limit**: 1,000 requests

### Best Practices
- Cache for **3 hours minimum** (data updates every 3-4 hours anyway)
- Limit to **10 requests per minute** max
- This gives you: 1000 ÷ 24 = ~41 requests per hour budget
- At 3-hour cache: ~8 requests per day per user

### Configuration
```typescript
const NASAFIRMSConfig = {
  cacheDurationSeconds: 10800,        // 3 hours
  rateLimitPerMinute: 10,
  rateLimitPerDay: 1000,
  maxRetries: 2,                      // Save quota
  circuitBreakerThreshold: 5,
  circuitBreakerTimeout: 3600         // 1 hour
}
```

---

## 📊 Cache Duration Decision Matrix

### How to Choose Cache Duration?

| Data Type | Update Frequency | Cache Duration | Example |
|-----------|------------------|----------------|---------|
| **Real-time** | Seconds-minutes | 1-5 minutes | Markets, social media |
| **Near real-time** | 10-30 minutes | 10-30 minutes | News, weather |
| **Hourly** | 1-6 hours | 1-3 hours | Satellite data |
| **Daily** | Once per day | 12-24 hours | Statistics, reports |
| **Static** | Rarely changes | 7+ days | Geographic data |

### Example Calculations

**NASA FIRMS (Satellite Fire Data)**
- Satellite pass: Every 3-4 hours
- Data latency: 3-4 hours
- **Decision**: Cache 3 hours ✅

**GDACS (Disaster Alerts)**
- Alert urgency: High
- Update frequency: Every 30 min
- **Decision**: Cache 15 min ✅

**ACLED (Conflict Events)**
- Compilation time: Daily batch
- API limit: 3000/year
- **Decision**: Cache 24 hours ✅

---

## 🔄 Retry Strategy

### Exponential Backoff Configuration

```typescript
// Retry delays for each attempt
const retryDelays = {
  attempt1: 2000,      // 2 seconds
  attempt2: 4000,      // 4 seconds (2^1 * 2000)
  attempt3: 8000,      // 8 seconds (2^2 * 2000)
  attempt4: 16000,     // 16 seconds (2^3 * 2000)
  attempt5: 32000      // 32 seconds (2^4 * 2000)
}

// Formula: delay = baseDelay * (2 ^ attemptNumber)
```

### When to Retry

✅ **DO retry on**:
- Network timeouts
- 5xx server errors
- Rate limit errors (429)
- Temporary DNS failures

❌ **DON'T retry on**:
- 4xx client errors (except 429)
- Invalid API keys (401, 403)
- Malformed requests (400)
- Not found (404)

### Retry Configuration by Priority

| Priority | Max Retries | Base Delay | Max Wait Time |
|----------|-------------|------------|---------------|
| Critical | 5 | 2000ms | ~1 minute |
| High | 3 | 2000ms | ~14 seconds |
| Medium | 2 | 3000ms | ~12 seconds |
| Low | 1 | 5000ms | ~5 seconds |

---

## 🔌 Circuit Breaker Configuration

### Purpose
Prevent cascading failures by temporarily disabling failing collectors.

### States
1. **CLOSED** (Normal): Requests flow through
2. **OPEN** (Failed): All requests blocked, return cached data
3. **HALF-OPEN** (Testing): Single test request allowed

### Configuration

```typescript
const circuitBreakerConfig = {
  // How many consecutive failures before opening circuit
  failureThreshold: 5,
  
  // How long to keep circuit open (seconds)
  timeout: 1800,  // 30 minutes
  
  // How many successful requests needed to close circuit
  successThreshold: 2
}
```

### Example Scenarios

**Scenario 1: API Temporary Outage**
1. Collector fails 5 times → Circuit OPENS
2. All requests return cached data for 30 minutes
3. After 30 min → Circuit goes HALF-OPEN
4. 1 test request sent → If succeeds → Circuit CLOSED
5. If fails → Circuit OPEN for another 30 min

**Scenario 2: Invalid API Key**
1. Immediate 401 error → Don't count as circuit failure
2. Log error and disable collector
3. Alert admin to fix API key

---

## 📈 Monitoring Queries

### Dashboard Queries

```sql
-- Active collectors status
SELECT 
  collector_name,
  enabled,
  last_run_at,
  last_success_at,
  consecutive_failures,
  circuit_open,
  total_events_collected,
  CASE 
    WHEN circuit_open THEN 'BLOCKED'
    WHEN consecutive_failures > 0 THEN 'DEGRADED'
    WHEN last_success_at > NOW() - INTERVAL '1 hour' THEN 'HEALTHY'
    ELSE 'STALE'
  END as health_status
FROM collector_status
ORDER BY enabled DESC, health_status, collector_name;

-- Rate limit usage (last 24 hours)
SELECT 
  collector_name,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE success = true) as successful,
  COUNT(*) FILTER (WHERE success = false) as failed,
  ROUND(AVG(response_time_ms)) as avg_response_ms,
  MAX(response_time_ms) as max_response_ms
FROM rate_limit_log
WHERE request_timestamp > NOW() - INTERVAL '24 hours'
GROUP BY collector_name
ORDER BY total_requests DESC;

-- Cache hit rate
SELECT 
  collector_name,
  COUNT(*) as cache_checks,
  COUNT(*) FILTER (WHERE last_success_at > NOW() - (cache_duration_seconds * INTERVAL '1 second')) as cache_hits,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE last_success_at > NOW() - (cache_duration_seconds * INTERVAL '1 second')) / COUNT(*),
    2
  ) as cache_hit_percentage
FROM collector_status
GROUP BY collector_name;

-- Events per collector (last 7 days)
SELECT 
  collector_name,
  COUNT(*) as event_count,
  COUNT(DISTINCT category) as categories,
  MAX(event_timestamp) as most_recent_event
FROM events
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY collector_name
ORDER BY event_count DESC;
```

---

## 🎯 Performance Targets

### API Collector Targets

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| **Response Time** | < 2 seconds | > 10 seconds |
| **Success Rate** | > 95% | < 80% |
| **Cache Hit Rate** | > 80% | < 50% |
| **Rate Limit Violations** | 0 | > 5 per day |
| **Circuit Open Events** | < 1 per week | > 3 per week |

### Frontend Targets

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| **Initial Load Time** | < 1 second | > 3 seconds |
| **Initial Payload** | < 50KB | > 200KB |
| **Full Event Load** | < 500ms | > 2 seconds |
| **Time to Interactive** | < 2 seconds | > 5 seconds |

---

## 🔐 Security Considerations

### API Key Storage

```typescript
// ❌ NEVER do this
const API_KEY = "abc123secret"; // Hardcoded

// ✅ Correct way
const API_KEY = process.env.NASA_FIRMS_API_KEY; // Environment variable

// In Supabase Edge Function
const API_KEY = Deno.env.get('NASA_FIRMS_API_KEY');
```

### Rate Limit per IP vs per User

```sql
-- Store IP address for rate limiting
ALTER TABLE rate_limit_log ADD COLUMN client_ip INET;

-- Create index
CREATE INDEX rate_limit_log_ip_timestamp_idx 
ON rate_limit_log (client_ip, request_timestamp DESC);

-- Query rate limit by IP
SELECT COUNT(*) 
FROM rate_limit_log 
WHERE client_ip = '1.2.3.4'
  AND request_timestamp > NOW() - INTERVAL '1 minute';
```

---

## 📝 Configuration File Example

```typescript
// config/collectors.ts

export const COLLECTOR_CONFIGS = {
  NASA_EONET: {
    name: 'NASA_EONET',
    cacheDurationSeconds: 1800,      // 30 minutes
    rateLimitPerMinute: 60,
    maxRetries: 3,
    circuitBreakerThreshold: 5,
    circuitBreakerTimeout: 1800,
    enabled: true,
    requiresAuth: false
  },
  
  ACLED: {
    name: 'ACLED',
    cacheDurationSeconds: 86400,     // 24 hours
    rateLimitPerMinute: 1,
    rateLimitPerDay: 8,
    rateLimitPerYear: 3000,
    maxRetries: 2,
    circuitBreakerThreshold: 3,
    circuitBreakerTimeout: 7200,
    enabled: true,
    requiresAuth: true,
    authType: 'API_KEY',
    priority: 'CRITICAL'
  },
  
  // ... other collectors
};

// Helper to get config
export const getCollectorConfig = (name: string) => {
  return COLLECTOR_CONFIGS[name] || null;
};

// Validate all configs on startup
export const validateConfigs = () => {
  Object.entries(COLLECTOR_CONFIGS).forEach(([name, config]) => {
    if (config.requiresAuth) {
      const apiKey = process.env[`${name}_API_KEY`];
      if (!apiKey) {
        console.error(`⚠️ ${name} requires auth but no API key found!`);
      }
    }
  });
};
```

---

## 🧪 Testing Checklist

### Per-Collector Tests

- [ ] Fetch with valid API key
- [ ] Fetch with invalid API key (should fail gracefully)
- [ ] Fetch with network timeout (should retry)
- [ ] Fetch when rate limited (should use cache)
- [ ] Cache hit (should not call API)
- [ ] Cache miss (should call API)
- [ ] Circuit breaker opens after N failures
- [ ] Circuit breaker closes after success
- [ ] Exponential backoff timing
- [ ] Data transformation/mapping

### Integration Tests

- [ ] All collectors run in parallel
- [ ] Duplicate events are deduplicated
- [ ] Database stores events correctly
- [ ] Rate limit log is populated
- [ ] Status table is updated
- [ ] Frontend receives lightweight data
- [ ] Frontend can load full event details

### Load Tests

- [ ] 100 concurrent users
- [ ] 1000 concurrent users
- [ ] Peak traffic simulation
- [ ] Rate limit enforcement under load
- [ ] Database performance under load

---

## 🚀 Deployment Checklist

### Before Deploying

- [ ] All API keys configured in Supabase secrets
- [ ] Database migrations applied
- [ ] Indexes created
- [ ] RLS policies configured
- [ ] Cron job scheduled
- [ ] Monitoring dashboard set up
- [ ] Alert notifications configured

### After Deploying

- [ ] Test each collector manually
- [ ] Verify cron job executes
- [ ] Check rate limit logs populate
- [ ] Monitor for errors
- [ ] Verify frontend loads correctly
- [ ] Check cache hit rates
- [ ] Monitor API quota usage

---

## 📞 Troubleshooting Guide

### Problem: Collector keeps failing

**Check:**
1. API key valid? `SELECT config FROM collector_status WHERE collector_name = 'X'`
2. Rate limited? `SELECT COUNT(*) FROM rate_limit_log WHERE collector_name = 'X' AND request_timestamp > NOW() - INTERVAL '1 minute'`
3. Circuit open? `SELECT circuit_open, circuit_open_until FROM collector_status WHERE collector_name = 'X'`
4. API endpoint changed? Test URL manually

### Problem: High rate limit violations

**Solution:**
1. Increase cache duration
2. Decrease rate limits
3. Add jitter to scheduled runs
4. Review collector priority

### Problem: Stale data

**Check:**
1. When was last successful fetch? `SELECT last_success_at FROM collector_status WHERE collector_name = 'X'`
2. Is collector enabled? `SELECT enabled FROM collector_status WHERE collector_name = 'X'`
3. Is cache too long? `SELECT cache_duration_seconds FROM collector_status WHERE collector_name = 'X'`

---

## 📚 Additional Resources

- [ARCHITECTURE_PLAN.md](./ARCHITECTURE_PLAN.md) - Full technical architecture
- [QUICK_SUMMARY.md](./QUICK_SUMMARY.md) - Executive summary
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [PostgreSQL Index Tuning](https://www.postgresql.org/docs/current/indexes.html)
