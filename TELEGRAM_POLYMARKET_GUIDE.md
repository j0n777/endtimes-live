# 🤖 Telegram Bot + 📊 Polymarket Integration - Guia Completo

## Sumário das Mudanças

### ✅ O Que Foi Implementado

1. **Telegram Bot API** - Substituiu autenticação complexa por bot token simples
2. **Polymarket Intelligence** - Integração com mercados de previsão para antecipar eventos
3. **Admin Panel Atualizado** - Nova UI para configurar ambas as fontes
4. **Data Sources Aggregator** - Telegram e Polymarket integrados ao sistema unificado

---

## 🤖 Telegram Bot Integration

### Por Que Mudamos?

**Antes:** Autenticação via API ID + Hash + Número de Telefone (complexo, requer sessão)  
**Agora:** Bot Token simples (muito mais fácil e confiável)

### Vantagens

- ✅ **Muito mais simples** - Apenas 1 token vs 3 credenciais
- ✅ **Sem sessão** - Não precisa manter autenticação ativa
- ✅ **Mais estável** - Bots têm rate limits melhores
- ✅ **Perfeito para monitoramento** - Bots são feitos para isso

### Como Configurar

#### Passo 1: Criar o Bot

1. Abra o Telegram
2. Procure por `@BotFather`
3. Envie o comando: `/newbot`
4. Siga as instruções:
   - Escolha um nome (ex: "End Times Monitor Bot")
   - Escolha um username (ex: "EndTimesMonitorBot")
5. **Copie o token** que o BotFather enviar (formato: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

#### Passo 2: Configurar no Admin Panel

1. Abra o app → Admin
2. Role até "TELEGRAM BOT INTEGRATION"
3. Cole o **Bot Token** no campo
4. Adicione os **IDs dos Canais** que quer monitorar

**Exemplo de IDs de Canais:**
- `@canaldenoticias` (username público)
- `-1001234567890` (ID numérico do canal)

#### Passo 3: Salvar e Testar

1. Clique em "SAVE CONFIGURATION"
2. Clique em "REFRESH" no header
3. Aguarde ~ 15-30 segundos
4. Verifique eventos do Telegram aparecendo no mapa

### Como Funciona

O serviço do Telegram:

1. **Busca mensagens recentes** dos canais configurados (últimas 24h)
2. **Classifica automaticamente** usando NLP em PT/EN:
   - Detecta categoria (CONFLICT, DISASTER, HEALTH, etc.)
   - Determina severidade (HIGH, ELEVATED, MEDIUM, LOW)
   - Extrai localização do texto
3. **Cria eventos** com coordenadas aproximadas
4. **Cache de 5 minutos** para performance

### Classificação Inteligente

O sistema reconhece automaticamente:

**Conflitos:**
```
Palavras-chave: guerra, ataque, bombardeio, míssil, invasão, militar, etc.
Exemplo: "Ataque com mísseis na Ucrânia" → CONFLICT / HIGH
```

**Desastres:**
```
Palavras-chave: terremoto, tsunami, furacão, inundação, incêndio, etc.
Exemplo: "Terremoto de magnitude 6.5 no Chile" → NATURAL_DISASTER / ELEVATED
```

**Saúde:**
```
Palavras-chave: pandemia, vírus, surto, epidemia, doença, etc.
Exemplo: "Surto de dengue em São Paulo" → PANDEMIC / MEDIUM
```

### Sugestões de Canais em Português

Canais de notícias geopolíticas recomendados:
- Canal de notícias brasileiro especializado em geopolítica
- Canais de análise de conflitos internacionais
- Fontes OSINT (Open Source Intelligence) em português

---

## 📊 Polymarket Intelligence

### O Que É?

Polymarket é uma plataforma de **mercados de previsão** onde pessoas apostam dinheiro real em eventos futuros.

### Por Que É Poderoso?

**Mercados antecipam eventos** porque:
- Pessoas colocam **dinheiro real** em suas previsões
- Informações privilegiadas movem os mercados
- **Coletivo é mais inteligente** que indivíduos isolados
- Markets reagem **mais rápido** que mídia tradicional

### Exemplos

**Cenário 1**: Mercado "Israel atacará o Irã em março?" está em 75%  
→ **Sinal**: Alta probabilidade de conflito iminente

**Cenário 2**: Mercado "WW3 começará em 2026?" pula de 5% para 30%  
→ **Sinal**: Algo crítico aconteceu, investigar

**Cenário 3**: Volume de $500k em 24h em mercado de guerra nuclear  
→ **Sinal**: Players sérios estão entrando, evento pode estar próximo

### Como Funciona no Sistema

1. **Busca mercados ativos** sobre:
   - Conflitos militares
   - Guerras
   - Ataques
   - Crises internacionais
   - Eventos políticos críticos

2. **Filtra por relevância** (score 0-100):
   - Palavras-chave relacionadas a fim dos tempos
   - Severidade do evento
   - Volume do mercado

3. **Extrai inteligência**:
   - **Probabilidade**: Ex: 65% de chance
   - **Volume 24h**: Quanto dinheiro está sendo movido
   - **Liquidez**: Tamanho do mercado

4. **Gera eventos** com título tipo:
   ```
   "Market: Israel will strike Iran nuclear facilities before April?"
   Probabilidade: 72% | Volume (24h): $234k | Liquidez: $1.2M
   ```

### Configuração

**Super simples!**

1. Abra Admin → "POLYMARKET INTELLIGENCE"
2. Toggle **ON** (vem ativado por padrão)
3. Salvar e Refresh
4. Pronto! Sem API key necessária (API pública gratuita)

### Limitações e Ética

**⚠️ IMPORTANTE:**

- Esta fonte é **apenas para inteligência**
- **NÃO incentivamos apostas** no Polymarket
- Use as informações para **antecipar eventos**, não para apostar
- Polymarket não aparece destacado no frontend (fonte discreta)

---

## 📝 Configuração Completa no Admin Panel

### Nova Estrutura

```
┌─────────────────────────────────────┐
│  TELEGRAM BOT INTEGRATION           │  ← Bot Token + Channel IDs
├─────────────────────────────────────┤
│  EXTERNAL API INTEGRATIONS          │  ← News API, NASA legacy
├─────────────────────────────────────┤
│  PHASE 1 DATA SOURCES               │  ← GDACS, EONET, ACLED, etc.
├─────────────────────────────────────┤
│  POLYMARKET INTELLIGENCE      │  ← Toggle ON/OFF
└─────────────────────────────────────┘
```

### Campos Removidos

- ❌ `telegramApiId` (não usado mais)
- ❌ `telegramApiHash` (não usado mais)
- ❌ `telegramPhone` (não usado mais)
- ❌ `customChannels` (substituído por `telegramChannelIds`)

### Campos Novos

- ✅ `telegramBotToken` - Token do @BotFather
- ✅ `telegramChannelIds` - Array de IDs de canais
- ✅ `polymarketEnabled` - Toggle para Polymarket

---

## 🚀 Resultados Esperados

### Sem Configuração Adicional

**Sources Ativas**: 7/9 (GDACS, NASA EONET, WHO, GDELT, Polymarket + 2 opcionais)  
**Eventos**: 400-600+

### Com Telegram Configurado

**Sources Ativas**: 8/9  
**Eventos**: 500-700+  
**Benefício**: + eventos em tempo real de canais brasileiros/portugueses

### Com ACLED + NASA FIRMS + Telegram

**Sources Ativas**: 9/9 ✅  
**Eventos**: 700-1000+  
**Benefício**: Cobertura completa máxima

---

## 🔍 Fluxo de Dados

```
┌─────────────────┐
│ Telegram Canais │──┐
└─────────────────┘  │
                     │
┌─────────────────┐  │       ┌──────────────────┐
│ Polymarket API  │──┤──────→│ Data Aggregator  │
└─────────────────┘  │       └──────────────────┘
                     │              │
┌─────────────────┐  │              ↓
│ 6 APIs Phase 1  │──┘       ┌──────────────┐
└─────────────────┘           │  500-1000+   │
                              │    Events    │
                              └──────────────┘
```

---

## 📊 Tipos de Inteligência Obtidas

### Telegram
- ✅ **Notícias em tempo real** de canais PT/BR
- ✅ **Análises geopolíticas** em português
- ✅ **OSINT local** sobre conflitos
- ✅ **Breaking news** antes da mídia tradicional

### Polymarket
- ✅ **Probabilidades de eventos futuros**
- ✅ **Antecipação de conflitos** (mercados movem antes)
- ✅ **Sentimento de insiders** (volume alto = algo está acontecendo)
- ✅ **Confirmação cruzada** (se mercado + fontes concordam = alta confiança)

---

## 🛠️ Arquivos Modificados/Criados

### Criados
- `services/telegram-service.ts` - Serviço Telegram Bot API
- `services/polymarket-service.ts` - Serviço Polymarket

### Modificados
- `types.ts` - Novos campos AdminConfig
- `services/data-sources.ts` - Telegram e Polymarket adicionados
- `components/AdminPanel.tsx` - Nova UI
- `App.tsx` - Simplificação (removido fetch AI separado)

---

## ✅ Checklist de Teste

### Telegram Bot
- [ ] Criar bot com @BotFather
- [ ] Copiar token
- [ ] Colar no Admin Panel
- [ ] Adicionar pelo menos 1 canal ID
- [ ] Salvar configuração
- [ ] Clicar REFRESH
- [ ] Aguardar 15-30s
- [ ] Verificar eventos do Telegram no mapa
- [ ] Verificar source name aparecendo como "Telegram Channel"

### Polymarket
- [ ] Verificar toggle está ON no Admin
- [ ] Salvar configuração
- [ ] Clicar REFRESH
- [ ] Aguardar 15-30s
- [ ] Verificar eventos com source "Polymarket (X% probability)"
- [ ] Verificar descrições contêm Volume e Liquidez
- [ ] Confirmar apenas mercados relevantes aparecem

### Header Status
- [ ] Verificar "8/9 SOURCES" ou "9/9 SOURCES"
- [ ] Verificar contador de eventos aumentou
- [ ] Verificar indicador verde pulsando

---

## 💡 Dicas Pro

1. **Telegram**: Adicione canais especializados em geopolítica brasileira/portuguesa para melhor classificação
2. **Polymarket**: Mercados com probabilidade >60% merecem atenção especial
3. **Cross-Reference**: Se Telegram + Polymarket + ACLED concordam = evento muito provável
4. **Cache**: Fontes em cache não contam contra rate limits, refresh múltiplas vezes OK
5. **Performance**: Primeiro load é lento, subsequentes são rápidos

---

## 🎯 Casos de Uso

### Monitoramento de Conflito Israel-Irã

**Telegram**: Canal @MidEastSpectator → notícias em tempo real  
**Polymarket**: Market "Iran will be attacked in Q1 2026" → 68% probability  
**ACLED**: 15 eventos de violência na região esta semana  
**Resultado**: Alta probabilidade de escalada iminente

### Detecção Precoce de Pandemia

**WHO**: Novo surto reportado  
**Polymarket**: Market "WHO declares pandemic in 2026" → 15% → 45% (jump!)  
**Telegram**: Canais médicos discutindo casos não reportados  
**Resultado**: Possível pandemia começando, monitorar closely

---

**Implementação completa! 🎉**

Agora você tem:
- ✅ Telegram Bot para canais em português
- ✅ Polymarket para inteligência de mercado
- ✅ 9 fontes de dados totais
- ✅ Cobertura global + local (PT/BR)
- ✅ Antecipação de eventos via mercados
