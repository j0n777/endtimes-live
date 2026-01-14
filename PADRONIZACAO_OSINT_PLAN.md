# 🎯 Plano de Implementação - Padronização e OSINT

## ✅ STATUS ATUAL (Funcionando!)

### Collectors Ativos (4/14)
- ✅ GDACS: 1 evento
- ✅ NASA EONET: 41 eventos (filtrado de 5718!)
- ✅ ACLED: 0 (circuit breaker - precisa API key válida)
- ✅ NASA FIRMS: 0 (precisa API key válida)

### Arquitetura Criada
- ✅ `StandardizedEvent.ts` - Estrutura de dados completa
- ✅ `GeocodingService.ts` - Geocoding AI + Nominatim
- ✅ Suporte para OSINT (câmeras, aviões militares, etc.)
- ✅ 3 níveis de dados (Lightweight/Standard/Full)

---

## 📋 PRÓXIMOS PASSOS

### 1. Implementar Data Sanitization Service (1h)

Criar `DataSanitizationService.ts`:
- ✅ Converter qualquer evento → `StandardizedEvent`
- ✅ Geocoding automático com IA
- ✅ Classificação de prioridade
- ✅ Extração de tags
- ✅ Verificação de qualidade

### 2. Atualizar Collectors Existentes (1h)

Modificar coletores para usar formato padronizado:
- ✅ GDACSCollector → StandardizedEvent
- ✅ NASAEONETCollector → StandardizedEvent  
- ✅ ACLEDCollector → StandardizedEvent
- ✅ NASAFIRMSCollector → StandardizedEvent

### 3. Implementar Novos Collectors (2-3h)

#### WHO Collector
- URL: `https://www.who.int/emergencies/disease-outbreak-news`
- Tipo: RSS/API
- Rate Limit: Sem limite
- Cache: 1 hora
- Dados: Epidemias, pandemias, emergências de saúde

#### GDELT Collector  
- URL: `https://api.gdeltproject.org/api/v2/doc/doc`
- Tipo: API REST
- Rate Limit: Sem limite oficial (usar 20 req/min)
- Cache: 15 minutos
- Dados: Notícias globais, conflitos, eventos políticos
- **Requer**: Geocoding AI para notícias

#### Polymarket Collector
- URL: `https://gamma-api.polymarket.com/events`
- Tipo: API REST
- Rate Limit: Sem limite oficial
- Cache: 5 minutos
- Dados: Mercados de predição (guerras, eleições, crises)
- **Insight**: Se mercado de "Guerra na Ucrânia" sobe → alerta

### 4. Frontend API (2h)

Criar endpoints Supabase Edge Functions:
```typescript
// Lightweight - Inicial (10-20KB)
GET /api/events/lightweight?severity=HIGH,ELEVATED&limit=300

// Standard - Cards (50-100KB) 
GET /api/events/standard?ids=123,456,789

// Full - Detalhes completos
GET /api/events/full/:id
```

### 5. OSINT Features (Futuro)

#### Câmeras Próximas
- Integrar com `insecam.org` API
- Buscar câmeras públicas em raio de 5km do evento
- Tipo: tráfego, segurança, webcams

#### Aviões Militares
- Integrar com `ADS-B Exchange` API
- Filtrar apenas aviões militares
- Mostrar rota e altitude em tempo real

#### Dia/Noite no Mapa
- Biblioteca: `@react-leaflet/core` já tem suporte
- Overlay simples baseado em hora UTC

---

## 🗂️ ESTRUTURA DE DADOS - 3 NÍVEIS

### Nível 1: Lightweight (Mapa Inicial)
```typescript
{
  id: 'evt_123',
  lat: 50.4501,
  lng: 30.5234,
  category: 'CONFLICT',
  severity: 'HIGH',
  priority: 1,
  timestamp: '2026-01-11T10:00:00Z'
}
```
**Uso**: Renderizar ~300 pontos no mapa  
**Tamanho**: ~10-20KB para 300 eventos

### Nível 2: Standard (Cards/Lista)
```typescript
{
  ...lightweight,
  title: 'Artillery Strike in Kyiv Downtown',
  location: {
    city: 'Kyiv',
    country: 'Ukraine'
  },
  source: 'ACLED',
  summary: 'Artillery strike reported in...' (200 chars)
}
```
**Uso**: Mostrar cards na sidebar  
**Tamanho**: ~50-100KB para 300 eventos

### Nível 3: Full (Detalhes)
```typescript
{
  ...standard,
  description: 'Full text...',
  location: {
    lat: 50.4501,
    lng: 30.5234,
    accuracy: 'street',
    address: 'Khreshchatyk Street, Kyiv',
    city: 'Kyiv',
    region: 'Kyiv Oblast',
    country: 'Ukraine',
    countryCode: 'UA',
    geocodedBy: 'ai',
    geocodingConfidence: 0.95
  },
  metadata: {
    casualties: 5,
    verified: true,
    aiProcessed: true,
    aiSummary: '...'
  },
  osint: {
    nearbyCameras: [{...}],
    relatedNews: [{...}]
  }
}
```
**Uso**: Modal/página de detalhes  
**Tamanho**: ~5-10KB por evento (carrega sob demanda)

---

## 🎯 GEOCODING - Níveis de Precisão

### Exact (Ideal)
- "123 Baker Street, London" → Lat/Lng do edifício
- Usado para: Ataques terroristas, desastres específicos

### Street  
- "Main Street, Springfield" → Centro da rua
- Usado para: Protestos, bloqueios

### City
- "Kyiv, Ukraine" → Centro da cidade
- Usado para: Maioria dos eventos

### Region
- "Donetsk Oblast" → Centro da região
- Usado para: Eventos de larga escala

### Country
- "Ukraine" → Centroide do país
- Usado para: Fallback apenas

---

## 🤖 IA - Casos de Uso

### 1. Geocoding Preciso
```
Input: "Artillery strike near central square in Mariupol"
AI Output: {
  lat: 47.0971,
  lng: 37.5432,
  accuracy: "street",
  city: "Mariupol",
  country: "Ukraine"
}
```

### 2. Extração de Dados de Notícias (GDELT)
```
Input: "Explosion kills 5 in downtown Damascus near government building"
AI Output: {
  title: "Explosion in Damascus",
  casualties: 5,
  location: "Damascus, Syria",
  actors: ["Unknown"],
  verified: false,
  tags: ["explosion", "casualties", "urban"]
}
```

### 3. Classificação de Prioridade
```
Input: Any evento
AI Output: {
  priority: 1-5,
  reasoning: "High casualties in major city",
  tags: ["urgent", "humanitarian"]
}
```

---

## 📊 RATE LIMITS - Verificação

| Source | Limit | Current | Status |
|--------|-------|---------|--------|
| **GDACS** | Unlimited | 60/min | ✅ OK |
| **WHO** | Unlimited | 30/min | ✅ OK |
| **GDELT** | Unofficial | 20/min | ✅ OK |
| **Polymarket** | Unlimited | 60/min | ✅ OK |
| **NASA EONET** | Unlimited | 60/min | ✅ OK |
| **NASA FIRMS** | 1000/day | 10/min | 🟡 Monitor |
| **ACLED** | 3000/year | 1/day | 🔴 CRITICAL |
| **Nominatim** | 1 req/sec | 1/sec | ✅ OK |

---

## 🚀 IMPLEMENTAÇÃO

### Prioridade Alta (Hoje)
1. ✅ DataSanitizationService
2. ✅ Atualizar collectors existentes
3. ✅ WHO Collector
4. ✅ GDELT Collector
5. ✅ Polymarket Collector

### Prioridade Média (Esta Semana)
6. ✅ Frontend Tiered API
7. ✅ Lightweight events endpoint
8. ✅ Atualizar App.tsx

### Prioridade Baixa (Futuro)
9. 🔮 OSINT - Câmeras próximas
10. 🔮 OSINT - Aviões militares
11. 🔮 Dia/Noite overlay
12. 🔮 Satellite imagery integration

---

## 💾 DATABASE UPDATES

Adicionar campos ao schema events:

```sql
ALTER TABLE events
ADD COLUMN IF NOT EXISTS geocoding_accuracy TEXT,
ADD COLUMN IF NOT EXISTS geocoding_confidence FLOAT,
ADD COLUMN IF NOT EXISTS ai_processed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS priority INT CHECK (priority BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS tags TEXT[];
```

---

**Próximo Comando**: Criar DataSanitizationService e converter collectors! 🎯
