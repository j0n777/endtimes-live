# 🔐 RLS Security - Quick Reference Card

## 📌 **Visão Geral - 1 Minuto**

**Status:** ✅ RLS Implementado em TODAS as tabelas  
**Proteção:** 🛡️ Dados sensíveis agora estão SEGUROS  
**Acesso Público:** 🟢 LIMITADO (apenas leitura de eventos recentes)  
**Migração:** 📄 `supabase/migrations/005_rls_security.sql`

---

## 🚀 **Aplicar AGORA (2 minutos)**

### **Passo 1: Rodar Migration**
```
1. Vá em: https://supabase.com/dashboard/project/bimfztwwzuwwefxfkkwe/sql
2. Copie: supabase/migrations/005_rls_security.sql
3. Cole no editor
4. Clique: RUN
```

### **Passo 2: Validar**
```bash
# No dashboard, execute:
supabase/validate_rls.sql

# Ou no terminal:
npx tsx scripts/test-rls-policies.ts
```

### **Passo 3: Confirmar no Dashboard**
```
Database → Tables → events → RLS: ✅ ENABLED (4 policies)
```

✅ **PRONTO!** Seu banco está seguro.

---

## 🔑 **Chaves - O Que Vai Onde**

### **Frontend (.env.local)**
```env
VITE_SUPABASE_ANON_KEY=eyJ...     # ✅ SIM
SUPABASE_SERVICE_ROLE_KEY=eyJ... # ❌ NUNCA!
```

### **Backend (.env - gitignored)**
```env
SUPABASE_SERVICE_ROLE_KEY=eyJ... # ✅ SIM
```

### **Regra de Ouro:**
```
🌐 Frontend = ANON KEY (público, limitado por RLS)
🖥️ Backend  = SERVICE KEY (admin, acesso total)
```

---

## 📊 **Tabelas - Quem Acessa O Quê**

| Tabela | Público (anon) | Authenticated | Service Role |
|--------|---------------|---------------|--------------|
| **events** | ✅ Leitura limitada (30d, priority≤3) | ✅ Leitura completa | ✅ CRUD completo |
| **collector_status** | ❌ BLOQUEADO | ✅ Leitura (admin) | ✅ CRUD completo |
| **rate_limit_log** | ❌ BLOQUEADO | ✅ Leitura (admin) | ✅ CRUD completo |
| **event_sources** | ⚠️ Campos básicos | ✅ Leitura completa | ✅ CRUD completo |

---

## ⚡ **Comandos Rápidos**

### **Testar RLS**
```bash
# Teste automatizado
npx tsx scripts/test-rls-policies.ts

# Validar SQL
# Cole supabase/validate_rls.sql no Supabase Dashboard
```

### **Ver Status RLS**
```sql
-- No Supabase SQL Editor:
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### **Verificar Políticas**
```sql
-- No Supabase SQL Editor:
SELECT tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE schemaname = 'public';
```

---

## 🚨 **Troubleshooting - Problemas Comuns**

### **Problema: "permission denied for table events"**
```
✅ Solução: Você está usando anon key. Use service_role key no backend.
```

### **Problema: "new row violates row-level security policy"**
```
✅ Solução: Tentando inserir com anon key. Collectors precisam de service_role.
```

### **Problema: Frontend não carrega eventos**
```
✅ Solução: Verifique se há eventos nos últimos 30 dias com priority ≤ 3.
```

### **Problema: Collector_status vazio no admin**
```
✅ Solução: Implemente autenticação ou use service_role no backend.
```

---

## 📚 **Documentação Completa**

| Arquivo | Conteúdo |
|---------|----------|
| `SECURITY_ANALYSIS_RLS.md` | Análise detalhada de segurança |
| `RLS_IMPLEMENTATION_GUIDE.md` | Guia passo-a-passo completo |
| `IMPLEMENTACAO_RLS_RESUMO.md` | Resumo em português |
| `supabase/migrations/005_rls_security.sql` | Migration SQL |
| `supabase/validate_rls.sql` | Script de validação |
| `scripts/test-rls-policies.ts` | Testes automatizados |

---

## ✅ **Checklist Pós-Implementação**

```
[ ] Migration aplicada
[ ] Todos os testes passaram (9/9 ✅)
[ ] Dashboard mostra RLS ENABLED em todas as tabelas
[ ] Frontend usa ANON_KEY
[ ] Backend usa SERVICE_ROLE_KEY
[ ] .env está no .gitignore
[ ] Rate limiting configurado no Supabase Dashboard
[ ] README.md atualizado
```

---

## 📞 **Suporte**

- **Dúvidas:** Consulte `RLS_IMPLEMENTATION_GUIDE.md`
- **Erros:** Veja seção Troubleshooting acima
- **Testes:** Execute `npx tsx scripts/test-rls-policies.ts`

---

## 🎯 **Antes vs Depois - Resumo Visual**

### **ANTES (INSEGURO) ❌**
```
┌─────────────────┐
│  ANON_KEY       │───┐
└─────────────────┘   │
                      ▼
              ┌────────────────────┐
              │ collector_status   │ 🔴 UNRESTRICTED
              │ (API keys visíveis)│
              └────────────────────┘
```

### **DEPOIS (SEGURO) ✅**
```
┌─────────────────┐
│  ANON_KEY       │───X──┐ (BLOQUEADO)
└─────────────────┘      │
                         ▼
                 ┌────────────────────┐
                 │ collector_status   │ 🛡️ RLS ENABLED
                 │ (API keys PRIVADAS)│
                 └────────────────────┘
                         ▲
┌─────────────────┐      │
│ SERVICE_ROLE    │──────┘ (PERMITIDO)
└─────────────────┘
```

---

**⏱️ Tempo Total de Implementação:** ~10 minutos  
**🔒 Nível de Segurança:** 🟢 ALTO  
**📊 Complexidade:** 🟡 MÉDIA  
**✅ Status:** PRONTO PARA PRODUÇÃO

---

**🛡️ Sua aplicação agora está SEGURA!**
