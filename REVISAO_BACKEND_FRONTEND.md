# 🔍 REVISÃO COMPLETA - Backend e Frontend

## ✅ **BACKEND - Status Atual**

### 1. Rate Limiting ✅ **FUNCIONANDO**

#### BaseCollector.ts
```typescript
// Implementado em checkRateLimits()
// Verifica 3 níveis:

1. Per-Minute: 
   - Conta requests nos últimos 60 segundos
   - Bloqueia se >= limite
   
2. Per-Day:
   - Conta requests nas últimas 24 horas
   - CRÍTICO para NASA FIRMS (1000/dia)
   
3. Per-Year:
   - Conta requests nos últimos 365 dias  
   - CRÍTICO para ACLED (3000/ano)
```

**Configuração Atual**:
| Collector | Min | Day | Year | Interval |
|-----------|-----|-----|------|----------|
| GDACS | 60 | - | - | 15 min |
| NASA EONET | 60 | - | - | 30 min |
| NASA FIRMS | 10 | 1000 | - | 3 horas |
| ACLED | 1 | 8 | 3000 | 24 horas |

### 2. Cache System ✅ **FUNCIONANDO**

#### Implementação
```typescript
// BaseCollector.collect()
// 1. Verifica cache antes de fazer request
const cached = await this.getCachedEvents();
if (cached && cached.length > 0) {
  return cached; // Retorna do Supabase, ZERO API calls
}

// 2. Só faz request se cache expirou
if (cacheAge > cacheDurationSeconds) {
  await fetchData(); // API call
}
```

**Cache Durations**:
```
GDACS: 15 min (desastres urgentes)
NASA EONET: 30 min (eventos naturais)
NASA FIRMS: 3 horas (satélite passa a cada 3-4h)
ACLED: 24 horas (PROTEÇÃO DE QUOTA)
```

### 3. Retry Logic ✅ **FUNCIONANDO**

```typescript
// fetchWithRetry() - Exponential Backoff
Attempt 1: Immediate
Attempt 2: Wait 2s (2^1 * 1000ms)
Attempt 3: Wait 4s (2^2 * 1000ms)
Attempt 4: Wait 8s (2^3 * 1000ms)
```

### 4. Circuit Breaker ✅ **FUNCIONANDO**

```typescript
// Após N falhas consecutivas:
if (consecutiveFailures >= threshold) {
  circuitOpen = true;
  circuitOpenUntil = now + timeout;
}

// Durante circuit open:
// - ZERO API calls
// - Retorna cache
// - Após timeout, tenta 1 request de teste
```

**Evidência**: ACLED circuit breaker abriu no teste (3 falhas)

### 5. Error Handling ✅ **ROBUSTO**

```typescript
// Níveis de fallback:
1. Retry com backoff (até maxRetries)
2. Se tudo falha → retorna cache
3. Se sem cache → retorna []
4. Circuit breaker previne cascata
5. Logging detalhado
```

---

## ❌ **FRONTEND - PROBLEMAS IDENTIFICADOS**

### 🚨 Problema 1: Polling Excessivo

#### Linha 63 - App.tsx
```typescript
const timer = setInterval(() => setCurrentTime(new Date()), 1000);
```
**Problema**: Atualiza relógio a cada 1 segundo  
**Impacto**: Causa re-renders (embora memoizado)  
**Solução**: ✅ OK para clock, mas não deve triggar data fetch

### 🚨 Problema 2: Chamadas Diretas às APIs

#### Linha 124 - App.tsx
```typescript
const { events, statuses } = await fetchAllDataSources(config);
```
**Problema**: 
- ❌ Chama APIs DIRETO do frontend
- ❌ Cada usuário = chamadas separadas
- ❌ Ignora cache do Supabase
- ❌ Sem rate limiting coordenado

**Solução Necessária**: Trocar por Supabase queries

### 🚨 Problema 3: LocalStorage como Source of Truth

#### Linha 37-61 - App.tsx
```typescript
const savedEvents = localStorage.getItem('monitor_events');
if (savedEvents) {
  setEvents(JSON.parse(savedEvents));
}
```
**Problema**:
- ❌ Cache local (não compartilhado entre usuários)
- ❌ Pode estar desatualizado
- ❌ Não usa dados do Supabase

**Solução Necessária**: Carregar do Supabase

### 🚨 Problema 4: Sem Auto-Refresh Backend

**Problema**: 
- ❌ Collectors só rodam quando usuário clica "Refresh"
- ❌ Deveria rodar automaticamente no backend (Edge Function + Cron)

**Solução Necessária**: Edge Function scheduled

---

## ✅ **ARQUITETURA CORRETA (Target)**

### Backend (Supabase Edge Functions)

```typescript
// DEVE EXISTIR: supabase/functions/collect-data/index.ts

import { CollectorOrchestrator } from './lib/collectors/CollectorOrchestrator';

// Roda a cada 5 minutos (Supabase Cron)
Deno.serve(async (req) => {
  const orchestrator = new CollectorOrchestrator(supabase);
  await orchestrator.runAllCollectors();
  
  return new Response(JSON.stringify({ success: true }));
});
```

**Cron Job**:
```sql
-- Configurar no Supabase Dashboard
SELECT cron.schedule(
  'collect-data-job',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT net.http_post(
    url := 'https://[project].supabase.co/functions/v1/collect-data',
    headers := '{"Authorization": "Bearer [key]"}'::jsonb
  )
  $$
);
```

### Frontend (React)

```typescript
// APP.TSX - CORRETO

// 1. Load inicial - Lightweight events do Supabase
useEffect(() => {
  loadInitialData();
}, []); // APENAS uma vez!

async function loadInitialData() {
  const { data } = await supabase.rpc('get_map_events', {
    p_priority_max: 2,
    p_limit: 300
  });
  setMapEvents(data); // 10-20KB
}

// 2. Refresh MANUAL apenas
const handleRefresh = async () => {
  await loadInitialData(); // Reload do Supabase
};

// ❌ SEM auto-refresh
// ❌ SEM polling
// ❌ SEM chamadas diretas a APIs
```

---

## 🔧 **CORREÇÕES NECESSÁRIAS**

### 1. Criar Edge Function para Coleta Automática

```typescript
// supabase/functions/collect-data/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Importar collectors (precisa adaptar para Deno)
  // const orchestrator = new CollectorOrchestrator(supabase);
  // await orchestrator.runAllCollectors();

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { "Content-Type": "application/json" } }
  );
});
```

### 2. Atualizar App.tsx

```typescript
// REMOVER
import { fetchAllDataSources } from './services/data-sources';

// ADICIONAR
import { supabase } from './lib/supabaseClient';

// SUBSTITUIR handleRefreshData
const handleRefreshData = async () => {
  setLoading(true);
  
  try {
    // Lightweight events do Supabase
    const { data, error } = await supabase.rpc('get_map_events', {
      p_priority_max: 2,
      p_limit: 300
    });
    
    if (error) throw error;
    
    setEvents(data || []);
    
    // Opcional: salvar em localStorage como cache offline
    if (data) {
      localStorage.setItem('monitor_events', JSON.stringify(data));
    }
    
  } catch (error) {
    console.error('Data refresh error:', error);
    
    // Fallback para LocalStorage se offline
    const cached = localStorage.getItem('monitor_events');
    if (cached) {
      setEvents(JSON.parse(cached));
    }
  }
  
  setLoading(false);
};
```

### 3. Remover Polling de Dados

```typescript
// ❌ REMOVER (se existir)
useEffect(() => {
  const interval = setInterval(() => {
    handleRefreshData();
  }, 60000); // Auto-refresh a cada minuto
  
  return () => clearInterval(interval);
}, []);

// ✅ MANTER apenas clock
useEffect(() => {
  const timer = setInterval(() => setCurrentTime(new Date()), 1000);
  return () => clearInterval(timer);
}, []);
```

---

## 📊 **FLUXO CORRETO DE DADOS**

### Atual (Errado) ❌
```
Frontend → fetchAllDataSources()
         → GDACS API (cada usuário)
         → NASA API (cada usuário)  
         → ACLED API (cada usuário)
         → ...

Problema: 100 usuários = 100x requests!
```

### Target (Correto) ✅
```
Backend (Cron 5min) → CollectorOrchestrator
                    → Check cache
                    → Se expirado: API call
                    → Salva no Supabase
                    
Frontend → Supabase.rpc('get_map_events')
         → Retorna cache (compartilhado)
         → 10-20KB payload

Benefício: 100 usuários = 1 backend job = mesmos dados!
```

---

## 🎯 **CHECKLIST DE CORREÇÕES**

### Backend ✅ (Já está correto!)
- [x] Rate limiting implementado
- [x] Cache com Supabase
- [x] Retry logic
- [x] Circuit breaker
- [x] Error handling
- [ ] **TODO**: Edge Function + Cron (próximo passo)

### Frontend ❌ (Precisa correção!)
- [ ] **TODO**: Remover fetchAllDataSources()
- [ ] **TODO**: Usar supabase.rpc() para dados
- [ ] **TODO**: Remover auto-refresh (se houver)
- [x] Clock update OK (não interfere)
- [ ] **TODO**: Tiered data loading

---

## 📋 **PRÓXIMAS AÇÕES**

### 1. **Agora** - Atualizar Frontend (30 min)
- Trocar fetchAllDataSources() por Supabase queries
- Implementar tiered loading
- Remover qualquer polling de dados

### 2. **Depois** - Edge Function (1 hora)
- Criar collect-data function
- Configurar Cron job
- Testar coleta automática

### 3. **Finalmente** - Novos Collectors (2-3 horas)
- WHO
- GDELT
- Polymarket

---

## 🚀 **PROPOSTA: Vou Implementar Agora**

1. ✅ Atualizar App.tsx para usar Supabase
2. ✅ Criar funções helper para tiered loading
3. ✅ Remover dependências de APIs diretas
4. ✅ Testar o fluxo completo

**Posso prosseguir com essas correções?**
