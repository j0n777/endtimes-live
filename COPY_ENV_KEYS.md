# 🔑 AÇÃO NECESSÁRIA: Copiar API Keys

## O Que Fazer AGORA

Você tem 2 arquivos de variáveis de ambiente:
- `.env.local` - Para Vite/Frontend (já configurado ✅)
- `.env` - Para Node.js/Collectors (precisa configurar ⚠️)

### Passo 1: Copie as variáveis

Abra `.env.local` e `.env` lado a lado e copie TODAS as chaves:

```bash
# Do .env.local para .env:

SUPABASE_SERVICE_ROLE_KEY=...        # CRÍTICO!
NASA_FIRMS_API_KEY=...
NASA_EONET_API_KEY=...
ACLED_API_KEY=...
ACLED_EMAIL=...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHANNEL_IDS=...
GEMINI_API_KEY=...
WEATHERBIT_API_KEY=...
NEWS_API_KEY=...
```

### Passo 2: Rodegerado o teste

```bash
npm run test:collectors
```

## ✅ Migrations Aplicadas com Sucesso!

Excelente! Se as migrations funcionaram, você agora tem:
- ✅ Tabela `collector_status` com todos os 14 collectors configurados
- ✅ Tabela `rate_limit_log` para controle de quotas
- ✅ Funções SQL para cache e rate limiting
- ✅ Row Level Security configurado

## 📋 Próximos Passos

### Fase 1: Converter Collectors Restantes (2-3 horas)

Já temos:
- ✅ GDACSCollector
- ✅ NASAEONETCollector
- ✅ ACLEDCollector

Faltam:
- [ ] NASAFIRMSCollector
- [ ] WHOCollector
- [ ] GDELTCollector
- [ ] PolymarketCollector
- [ ] TelegramCollector
- [ ] WeatherNWSCollector
- [ ] CyberAttacksCollector
- [ ] InternetShutdownsCollector
- [ ] VIXCollector
- [ ] EmbassyCollector
- [ ] NOTAMCollector

### Fase 2: Frontend Inteligente (1-2 horas)

Implementar:
1. **Filtros de Severidade Inteligentes**
   - Carregar APENAS HIGH/ELEVATED no primeiro acesso
   - Usuário pode expandir para MEDIUM/LOW sob demanda

2. **Limite Automático por Categoria**
   - NASA EONET: Max 50 eventos (filtrado por severidade)
   - NASA FIRMS: Max 20 incêndios (>100 MW FRP)
   - ACLED: Max 50 conflitos (>10 fatalidades)

3. **Paginação/Lazy Loading**
   - Carregar 50 eventos iniciais
   - "Carregar mais" sob demanda

4. **Remover Polling**
   - Sem auto-refresh
   - Apenas manual ou após 5 minutos de inatividade

## 🎯 Vamos começar?

Primeiro: **Copie as API keys** do .env.local para .env
Depois: Vou converter todos os collectors restantes!
