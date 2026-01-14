# ✅ Correção Aplicada - Variáveis de Ambiente

## Problema Resolvido

✅ **Problema**: `import.meta.env` não funciona no Node.js (tsx)  
✅ **Solução**: Criado helper que funciona em ambos ambientes (Vite + Node.js)

## Mudanças Feitas

### 1. Atualizado `lib/supabaseClient.ts`
- Criado função `getEnv()` que verifica tanto `import.meta.env` (Vite/browser) quanto `process.env` (Node.js)
- Suporta múltiplos nomes de variáveis (`VITE_*`, `NEXT_PUBLIC_*`, etc.)

### 2. Criado arquivo `.env`
- Para scripts Node.js (tsx, testes)
- Contém as mesmas variáveis que `.env.local`
- **Lembre-se**: Adicione seu `SUPABASE_SERVICE_ROLE_KEY`!

### 3. Atualizado `test-collectors.ts`
- Carrega variáveis do `.env` usando dotenv

### 4. Corrigidos collectors
- `ACLEDCollector.ts`: Usa `process.env` ✅
- `NASAEONETCollector.ts`: Usa `process.env` ✅
- `GDACSCollector.ts`: Usa jsdom para Node.js ✅

### 5. Instaladas dependências
- `tsx`: TypeScript runner para Node.js ✅
- `dotenv`: Carrega .env no Node.js ✅
- `jsdom`: DOM parser para Node.js ✅

## Próximos Passos

### 1. Adicione o Service Role Key no `.env`

Edite `e:\mycode\End-Times-Monitor\.env`:

```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi... (sua chave real aqui)
```

Pegue a chave em: https://supabase.com/dashboard/project/bimfztwwzuwwefxfkkwe/settings/api

### 2. (Opcional) Adicione API keys

Se quiser testar ACLED:
```
ACLED_API_KEY=sua_chave
ACLED_EMAIL=seu_email
```

Se quiser testar NASA EONET com key:
```
NASA_EONET_API_KEY=sua_chave
```

### 3. Teste Novamente

```bash
npm run test:collectors
```

Agora deve funcionar! 🎉

## Estrutura de Variáveis

### Para Vite/Frontend (`.env.local`):
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### Para Node.js/Scripts (`.env`):
```
VITE_SUPABASE_URL=...          # Mesma URL
VITE_SUPABASE_ANON_KEY=...     # Mesma key
SUPABASE_SERVICE_ROLE_KEY=...  # Só para backend!
```

### Suporte Legado:
O código também aceita:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`

## ⚠️ Importante

1. **NUNCA** commite `.env` ou `.env.local` no git!
2. O `.gitignore` já está configurado para ignorar esses arquivos
3. O `SUPABASE_SERVICE_ROLE_KEY` tem acesso TOTAL ao banco - use com cuidado!

## Arquivos Modificados

- ✅ `lib/supabaseClient.ts` - Compatível com Vite e Node.js
- ✅ `lib/collectors/ACLEDCollector.ts` -  `process.env`
- ✅ `lib/collectors/NASAEONETCollector.ts` - `process.env`
- ✅ `lib/collectors/GDACSCollector.ts` - jsdom para Node.js
- ✅ `test-collectors.ts` - Carrega dotenv
- ✅ `.env` - Criado (preencha o service key!)
- ✅ `package.json` - Adicionado script test:collectors

## Status

🎉 **Tudo pronto para testar!** Só falta:
1. Aplicar as migrations no Supabase (ver `QUICKSTART_MIGRATIONS.md`)
2. Adicionar `SUPABASE_SERVICE_ROLE_KEY` no `.env`
3. Rodar `npm run test:collectors`
