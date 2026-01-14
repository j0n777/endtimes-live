# Análise de Segurança - Row Level Security (RLS)

## 🔍 **Status Atual da Segurança**

### ❌ **Problemas Críticos Identificados**

Baseado na análise da codebase e na screenshot do Supabase, identificamos os seguintes problemas:

#### **Tabelas SEM RLS Habilitado (UNRESTRICTED):**
1. ✅ `collector_status` - **SEM PROTEÇÃO**
2. ✅ `rate_limit_log` - **SEM PROTEÇÃO**
3. ⚠️ `events` - Tem RLS mas com políticas inadequadas
4. ⚠️ `event_sources` - Tem RLS mas com políticas inadequadas
5. ✅ `events_by_category` - VIEW (herda RLS das tabelas base)
6. ✅ `recent_high_priority_events` - VIEW (herda RLS das tabelas base)
7. ✅ `geography_columns` - PostGIS (sistema)
8. ✅ `geometry_columns` - PostGIS (sistema)
9. ✅ `spatial_ref_sys` - PostGIS (sistema)

### 🚨 **Vulnerabilidades Atuais**

1. **Acesso Público Irrestrito:**
   - Qualquer pessoa com a `anon_key` pode ler dados de `collector_status`
   - Logs de rate limiting estão expostos publicamente
   - Configurações sensíveis de API estão visíveis

2. **Ausência de Autenticação:**
   - Não há sistema de autenticação implementado
   - Não há diferenciação entre usuários públicos e administradores
   - Service role key pode estar exposta no frontend

3. **Políticas RLS Inadequadas:**
   - Política "Events are viewable by everyone" permite leitura global
   - Política de modificação depende apenas de `auth.role() = 'service_role'`
   - Sem proteção contra DoS/spam de leitura

---

## ✅ **Arquitetura de Segurança Recomendada**

### **1. Modelo de Acesso**

```
┌─────────────────────────────────────────────────────────────┐
│                    NÍVEIS DE ACESSO                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  🌐 PUBLIC (anon)          - Leitura limitada de events      │
│  👤 AUTHENTICATED          - Leitura completa de events      │
│  🔧 SERVICE_ROLE (backend) - CRUD completo em todas tabelas  │
│  🛡️ ADMIN (authenticated)  - Dashboard admin + configs       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### **2. Proteções por Tabela**

#### **A) `events` (Eventos Públicos)**
- ✅ **SELECT (PUBLIC):** Permitir leitura de eventos recentes (<30 dias)
- ✅ **SELECT (PUBLIC):** Limitar a 1000 registros por query
- ❌ **INSERT/UPDATE/DELETE:** Apenas SERVICE_ROLE via backend

#### **B) `collector_status` (Configurações Sensíveis)**
- ❌ **SELECT (PUBLIC):** BLOQUEADO
- ✅ **SELECT (ADMIN):** Permitir leitura
- ❌ **INSERT/UPDATE/DELETE:** Apenas SERVICE_ROLE

#### **C) `rate_limit_log` (Logs Internos)**
- ❌ **SELECT (PUBLIC):** BLOQUEADO
- ✅ **SELECT (ADMIN):** Permitir leitura
- ❌ **INSERT/UPDATE/DELETE:** Apenas SERVICE_ROLE

#### **D) `event_sources` (Configurações de Fontes)**
- ✅ **SELECT (PUBLIC):** Apenas campos não-sensíveis (name, type, enabled)
- ✅ **SELECT (ADMIN):** Todos os campos
- ❌ **INSERT/UPDATE/DELETE:** Apenas SERVICE_ROLE

---

## 🛡️ **Implementação de RLS**

### **Fase 1: Habilitar RLS em Todas as Tabelas**
```sql
-- Ativar RLS
ALTER TABLE collector_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_log ENABLE ROW LEVEL SECURITY;
-- events e event_sources já têm RLS
```

### **Fase 2: Criar Políticas Granulares**

#### **1. Events - Leitura Pública Limitada**
```sql
-- Remover política antiga
DROP POLICY IF EXISTS "Events are viewable by everyone" ON events;

-- Nova política: Público vê apenas eventos recentes
CREATE POLICY "public_read_recent_events"
ON events FOR SELECT
TO anon
USING (
  event_timestamp > NOW() - INTERVAL '30 days'
  AND priority <= 3 -- Apenas prioridades média ou superior
);

-- Usuários autenticados veem tudo
CREATE POLICY "authenticated_read_all_events"
ON events FOR SELECT
TO authenticated
USING (true);
```

#### **2. Collector Status - Apenas Admin**
```sql
-- Bloquear público completamente
CREATE POLICY "block_public_collector_status"
ON collector_status FOR ALL
TO anon
USING (false);

-- Admins leem apenas
CREATE POLICY "admin_read_collector_status"
ON collector_status FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'admin'
);
```

#### **3. Rate Limit Log - Apenas Admin**
```sql
-- Bloquear público
CREATE POLICY "block_public_rate_logs"
ON rate_limit_log FOR ALL
TO anon
USING (false);

-- Admins leem apenas
CREATE POLICY "admin_read_rate_logs"
ON rate_limit_log FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'admin'
);
```

### **Fase 3: Service Role para Backend**
```sql
-- Service role tem acesso total (já funciona por padrão)
-- Garantir que collectors usem service_role key
```

---

## 🔐 **Melhores Práticas Supabase**

### **1. Separação de Chaves**
```env
# ✅ Frontend (.env.local - VITE)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG... (PÚBLICA - SEM PERMISSÕES WRITE)

# ✅ Backend (Edge Functions / Collectors)
SUPABASE_SERVICE_ROLE_KEY=eyJhbG... (PRIVADA - NUNCA EXPOR)
```

### **2. Endpoints Específicos**

**Frontend:**
```typescript
// Usar anon key (RLS protege automaticamente)
const supabase = createClient(url, ANON_KEY);
const { data } = await supabase.from('events').select('*');
// 👍 RLS permite apenas leitura limitada
```

**Backend (Collectors):**
```typescript
// Usar service role key (bypassa RLS)
const supabaseAdmin = createClient(url, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});
await supabaseAdmin.from('events').insert(newEvents);
// 👍 Pode inserir/atualizar
```

### **3. Rate Limiting no Frontend**
```sql
-- Criar função para limitar queries públicas
CREATE OR REPLACE FUNCTION public.get_recent_events(
  limit_count INT DEFAULT 100
)
RETURNS SETOF events AS $$
BEGIN
  IF limit_count > 1000 THEN
    RAISE EXCEPTION 'Limit cannot exceed 1000';
  END IF;
  
  RETURN QUERY
  SELECT * FROM events
  WHERE event_timestamp > NOW() - INTERVAL '30 days'
  ORDER BY priority ASC, event_timestamp DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **4. Proteger Campos Sensíveis**
```sql
-- Criar VIEW para dados públicos de event_sources
CREATE OR REPLACE VIEW public_event_sources AS
SELECT 
  id,
  name,
  type,
  enabled,
  last_fetch,
  event_count
FROM event_sources;

-- RLS na VIEW
ALTER VIEW public_event_sources SET (security_barrier = true);
```

---

## 📊 **Auditoria de Segurança**

### **Checklist de Validação:**
- [ ] Todas as tabelas têm RLS habilitado
- [ ] Políticas públicas limitam dados expostos
- [ ] Service role key nunca está no frontend
- [ ] Anon key só tem permissões de leitura limitada
- [ ] Logs e configs sensíveis estão protegidos
- [ ] Rate limiting implementado em queries públicas
- [ ] VIEWs públicas não expõem dados sensíveis
- [ ] JWT roles configurados para admin

---

## 🚀 **Próximos Passos**

1. **Implementar políticas RLS** (migration SQL)
2. **Auditar uso de chaves** no código frontend/backend
3. **Criar sistema de autenticação** (opcional - se precisar de admins)
4. **Adicionar rate limiting** no Supabase Dashboard
5. **Testar políticas** com anon_key e service_role
6. **Monitorar logs de acesso** via Supabase Analytics

---

## 📚 **Referências**
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/going-into-prod)
