-- Canal próprio do Telegram (@geopoliticaenoticias) como fonte de notícias (05/11/2026).
-- Rode no SQL Editor. Sem esta linha o coletor responde "Not configured in database".
INSERT INTO collector_status (collector_name, enabled, cache_duration_seconds, rate_limit_per_minute)
VALUES ('TELEGRAM_GEOPOLITICA', true, 300, 10)
ON CONFLICT (collector_name) DO UPDATE SET enabled = true;
