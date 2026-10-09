-- Diagnóstico e endurecimento da Supabase do End Times Monitor (07/10/2026).
-- Rode no Supabase Dashboard → SQL Editor. A PARTE 1 só lê; a PARTE 2 altera
-- permissões e roda dentro de uma transação. Leia o resultado da parte 1 antes.

-- ═══ PARTE 1 — DIAGNÓSTICO (somente leitura) ═══════════════════════════════

-- 1a. Tamanho do banco (limite do plano gratuito: 500 MB)
SELECT pg_size_pretty(pg_database_size(current_database())) AS tamanho_banco;

-- 1b. Maiores tabelas de todos os schemas (logs do pg_cron e do pg_net costumam inchar)
SELECT n.nspname || '.' || c.relname AS tabela,
       pg_size_pretty(pg_total_relation_size(c.oid)) AS tamanho_total,
       c.reltuples::bigint AS linhas_estimadas
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema') AND c.relkind IN ('r', 'm')
ORDER BY pg_total_relation_size(c.oid) DESC
LIMIT 20;

-- 1c. Storage (limite do plano gratuito: 1 GB)
SELECT bucket_id, count(*) AS arquivos,
       pg_size_pretty(sum((metadata->>'size')::bigint)) AS tamanho
FROM storage.objects GROUP BY bucket_id;

-- 1d. Jobs agendados (a limpeza de rate_limit_log dependia de pg_cron).
--     Se der erro "schema cron does not exist", o pg_cron não está ligado: tudo bem,
--     o worker agora faz essa limpeza (lib/maintenance.ts).
SELECT jobid, jobname, schedule, command, active FROM cron.job;

-- 1e. Políticas RLS em vigor. security.sql e 005_rls_security.sql criam políticas
--     que se contradizem; políticas permissivas se somam (OR), então a mais aberta vence.
SELECT tablename, policyname, cmd, roles, qual
FROM pg_policies WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 1f. Funções que o público (anon) consegue executar
SELECT p.oid::regprocedure AS funcao, p.prosecdef AS security_definer, p.proconfig AS config
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND has_function_privilege('anon', p.oid, 'EXECUTE')
ORDER BY 1;

-- ═══ PARTE 2 — ENDURECIMENTO ════════════════════════════════════════════════
BEGIN;

-- 2a. Funções de escrita/manutenção não devem ser chamáveis pelo navegador.
--     Hoje a anon consegue chamar clear_collector_events (testado em 07/10/2026 com
--     um nome de coletor inexistente, sem apagar nada). Se o RLS estiver como em
--     security.sql, a função roda com as permissões de quem chama e a deleção é
--     bloqueada, mas não vale a pena depender só disso.
DO $$
DECLARE f regprocedure;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('clear_collector_events', 'cleanup_old_rate_logs', 'log_security_event',
                        'check_rate_limit', 'get_request_count', 'get_cached_events')
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f);
  END LOOP;
END $$;

-- 2b. Toda função SECURITY DEFINER precisa de search_path fixo (senão um schema
--     malicioso no caminho pode sequestrar nomes de tabela/função).
DO $$
DECLARE f regprocedure;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
      AND NOT EXISTS (SELECT 1 FROM unnest(coalesce(p.proconfig, '{}')) c WHERE c LIKE 'search_path=%')
      -- Funções de extensões (ex.: PostGIS) pertencem ao supabase_admin; alterá-las dá
      -- "must be owner of function" e aborta a transação inteira.
      AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e')
      AND pg_has_role(p.proowner, 'USAGE')
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', f);
  END LOOP;
END $$;

COMMIT;

-- 2c. (Manual) Depois de ver o resultado de 1e, apague as políticas de SELECT que não
--     quiser manter. Ex.: se a ideia é o público ver só eventos recentes/importantes,
--     remova a política aberta:  DROP POLICY "Public Read Events" ON events;
