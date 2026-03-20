# 🛡️ Guia de Implementação - Segurança RLS (Row Level Security)

## 📋 **Checklist de Implementação**

### **Fase 1: Aplicar Migration SQL**

#### **Opção A: Via Supabase Dashboard (Recomendado)**
1. Acesse: https://supabase.com/dashboard/project/[seu-project-id]/sql
2. Copie todo o conteúdo de `supabase/migrations/005_rls_security.sql`
3. Cole no editor SQL
4. Clique em **"Run"**
5. Verifique se há erros (devem aparecer mensagens de NOTICE sobre status de RLS)

#### **Opção B: Via CLI Local**
```bash
# Se você tem Supabase CLI instalado
supabase db push

# Ou aplicar apenas esta migration:
supabase migration up --db-url "postgresql://postgres:[SENHA]@db.[PROJECT].supabase.co:5432/postgres"
```

---

### **Fase 2: Validar Configuração de Chaves**

#### **1. Verificar arquivo `.env.local` (Frontend)**
```env
# ✅ CORRETO - Apenas chave pública
VITE_SUPABASE_URL=https://bimfztwwzuwwefxfkkwe.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ❌ NUNCA inclua no frontend:
# SUPABASE_SERVICE_ROLE_KEY=... (PERIGOSO!)
```

#### **2. Criar/Verificar `.env` (Backend/Scripts)**
```env
# Para collectors e edge functions
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### **3. Atualizar `.gitignore`**
```gitignore
# Já deve estar ignorado, mas confira:
.env
.env.local
*.key
```

---

### **Fase 3: Atualizar Código da Aplicação**

#### **1. Frontend: Usar apenas ANON key**

**Arquivo: `lib/supabaseClient.ts`** (já está correto, mas valide)
```typescript
// ✅ Cliente público (frontend)
export const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY! // Apenas anon key
);

// ❌ NUNCA fazer isso no frontend:
// createClient(url, SERVICE_ROLE_KEY) <- PERIGOSO!
```

#### **2. Backend: Usar SERVICE_ROLE key**

**Exemplo: Collectors** (já está correto em `CollectorOrchestrator.ts`)
```typescript
import { createServiceClient } from '../supabaseClient';

// ✅ Usar service client para operações de escrita
const supabaseAdmin = createServiceClient(
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

await supabaseAdmin.from('events').insert(newEvents); // Bypassa RLS
```

#### **3. Atualizar queries públicas para usar função segura**

**Antes (vulnerável a data exposure):**
```typescript
const { data } = await supabase
  .from('events')
  .select('*') // Pode expor todos os eventos
  .limit(100);
```

**Depois (usando função rate-limited):**
```typescript
const { data } = await supabase
  .rpc('get_public_events', {
    p_limit: 100,
    p_min_priority: 3 // Apenas prioridade 1-3
  });
```

---

### **Fase 4: Testar Políticas de Segurança**

#### **Teste 1: Acesso Público (anon key)**

```javascript
// No console do browser dev tools:
const { createClient } = require('@supabase/supabase-js');

const supabasePublic = createClient(
  'https://bimfztwwzuwwefxfkkwe.supabase.co',
  'eyJhbG...' // SUA ANON KEY
);

// ✅ DEVE FUNCIONAR: Ler eventos recentes
const { data: events } = await supabasePublic
  .from('events')
  .select('id, title, category')
  .limit(10);
console.log('Public events:', events); // Deve retornar apenas recentes

// ❌ DEVE FALHAR: Tentar inserir
const { error } = await supabasePublic
  .from('events')
  .insert({ title: 'Hack attempt' });
console.log('Insert error:', error); // Deve dar erro de permissão

// ❌ DEVE FALHAR: Ler collector_status
const { data: status, error: statusError } = await supabasePublic
  .from('collector_status')
  .select('*');
console.log('Status error:', statusError); // Deve bloquear

// ❌ DEVE FALHAR: Ler rate_limit_log
const { data: logs, error: logsError } = await supabasePublic
  .from('rate_limit_log')
  .select('*');
console.log('Logs error:', logsError); // Deve bloquear
```

#### **Teste 2: Acesso Admin (service_role key)**

```javascript
// Em um ambiente BACKEND/SEGURO (NUNCA no browser):
const supabaseAdmin = createClient(
  'https://bimfztwwzuwwefxfkkwe.supabase.co',
  'SERVICE_ROLE_KEY_AQUI' // USA ENV VAR
);

// ✅ DEVE FUNCIONAR: Ler tudo
const { data: allEvents } = await supabaseAdmin
  .from('events')
  .select('*');
console.log('All events:', allEvents.length);

// ✅ DEVE FUNCIONAR: Inserir
const { error } = await supabaseAdmin
  .from('events')
  .insert({
    lat: 0,
    lng: 0,
    category: 'TEST',
    severity: 'LOW',
    title: 'Test event',
    event_timestamp: new Date().toISOString()
  });
console.log('Insert success:', !error);

// ✅ DEVE FUNCIONAR: Ler configs sensíveis
const { data: configs } = await supabaseAdmin
  .from('collector_status')
  .select('*');
console.log('Configs:', configs.length);
```

#### **Teste 3: Função Pública Rate-Limited**

```javascript
const { data, error } = await supabasePublic
  .rpc('get_public_events', {
    p_limit: 50,
    p_min_priority: 2
  });

console.log('Safe events:', data?.length); // ✅ Deve funcionar

// Tentar exceder limite
const { error: limitError } = await supabasePublic
  .rpc('get_public_events', {
    p_limit: 1000 // Excede máximo de 500
  });

console.log('Limit error:', limitError); // ❌ Deve rejeitar
```

---

### **Fase 5: Configurar Dashboard Supabase**

#### **1. API Rate Limiting**
1. Vá em: **Settings** → **API**
2. Ative **Rate Limiting**:
   - Anon key: 100 requests/minute
   - Service key: Unlimited (ou alto)

#### **2. Habilitar Audit Logs**
1. Vá em: **Database** → **Logs**
2. Monitore queries suspeitas

#### **3. Revisar Políticas RLS**
1. Vá em: **Authentication** → **Policies**
2. Verifique que todas as tabelas estão com RLS ativado:
   - ✅ `events` - ENABLED
   - ✅ `event_sources` - ENABLED
   - ✅ `collector_status` - ENABLED
   - ✅ `rate_limit_log` - ENABLED

---

### **Fase 6: Hardening Adicional (Opcional)**

#### **1. Configurar CORS**
```javascript
// No Supabase Dashboard → Settings → API
// Restrinja domínios permitidos:
Allowed origins: https://seu-dominio.com
```

#### **2. IP Whitelisting (para service_role)**
```sql
-- Criar política baseada em IP (exemplo)
CREATE POLICY "restrict_service_role_by_ip"
ON events FOR ALL
TO service_role
USING (
  inet_client_addr() << '192.168.1.0/24'::inet
  -- Ajuste para IP do seu servidor
);
```

#### **3. Implementar Autenticação (Admin Dashboard)**
```typescript
// Adicionar Supabase Auth ao admin dashboard
import { Auth } from '@supabase/auth-ui-react';

// Proteger rotas admin
const AdminPanel = () => {
  const { session } = useSession();
  
  if (!session) {
    return <Auth supabaseClient={supabase} />;
  }
  
  // Verificar role admin
  const isAdmin = session.user.user_metadata?.role === 'admin';
  
  if (!isAdmin) {
    return <div>Acesso negado</div>;
  }
  
  // Render admin panel...
};
```

---

## 🔍 **Validação Final**

### **Checklist de Segurança:**
- [ ] Migration `005_rls_security.sql` aplicada com sucesso
- [ ] Todas as tabelas mostram RLS ENABLED no dashboard
- [ ] Anon key NO frontend (`.env.local`)
- [ ] Service role key APENAS no backend (`.env` - gitignored)
- [ ] Teste público: não consegue ler `collector_status`
- [ ] Teste público: não consegue inserir em `events`
- [ ] Teste público: consegue ler eventos recentes via RPC
- [ ] Dashboard Supabase: rate limiting ativado
- [ ] Sem chaves hardcoded no código
- [ ] `.gitignore` inclui `.env` e `.env.local`

---

## 📊 **Monitoramento Pós-Deployment**

### **1. Queries SQL para Auditoria**

```sql
-- Ver todas as políticas RLS ativas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Ver status RLS de todas as tabelas
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Ver últimos registros de audit log
SELECT 
  user_role,
  action,
  table_name,
  success,
  created_at
FROM security_audit_log
ORDER BY created_at DESC
LIMIT 50;
```

### **2. Alertas a Configurar**

- [ ] Alerta se `collector_status` for acessado por anon
- [ ] Alerta se taxa de erros RLS > 10%
- [ ] Alerta se service_role fizer 1000+ requests/min
- [ ] Alerta se houver tentativas de INSERT com anon key

---

## 🚨 **Troubleshooting**

### **Problema: "new row violates row-level security policy"**
**Causa:** Tentando inserir com anon key  
**Solução:** Use service_role key no backend

### **Problema: "permission denied for table events"**
**Causa:** RLS bloqueando acesso legítimo  
**Solução:** Revise políticas, pode precisar ajustar `USING` clause

### **Problema: Collectors não conseguem inserir eventos**
**Causa:** Usando anon key em vez de service_role  
**Solução:** Verificar que `SUPABASE_SERVICE_ROLE_KEY` está configurada

### **Problema: Frontend não carrega eventos**
**Causa:** Política muito restritiva ou sem eventos recentes  
**Solução:** Verificar se há eventos nos últimos 30 dias com priority ≤ 3

---

## 📚 **Recursos Adicionais**

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)

---

## ✅ **Confirmação de Sucesso**

Após implementar tudo acima, você deve ver no Supabase Dashboard:

```
Table Editor → collector_status  
Status: 🔒 RLS enabled

Table Editor → rate_limit_log  
Status: 🔒 RLS enabled

Table Editor → events  
Status: 🔒 RLS enabled (4 policies)

Table Editor → event_sources  
Status: 🔒 RLS enabled (3 policies)
```

**🎉 Parabéns! Seu banco de dados agora está protegido com RLS!**
