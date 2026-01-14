# 🚀 Quick Start - Apply Migrations

## What You Need to Do RIGHT NOW

### Step 1: Apply Database Migrations (5 minutes)

1. **Go to Supabase SQL Editor**:
   https://supabase.com/dashboard/project/bimfztwwzuwwefxfkkwe/sql/new

2. **Run Migration 1** - Copy and paste this entire file content, then click "Run":
   `supabase/migrations/001_collector_status.sql`

3. **Run Migration 2** - Copy and paste this entire file content, then click "Run":
   `supabase/migrations/002_rate_limiting.sql`

4. **Run Migration 3** - Copy and paste this entire file content, then click "Run":
   `supabase/migrations/003_events_optimization.sql`

### Step 2: Get Service Role Key (2 minutes)

1. Go to: https://supabase.com/dashboard/project/bimfztwwzuwwefxfkkwe/settings/api

2. Under "Project API keys", find the "service_role" key

3. Copy it

4. Open `.env.local` in your editor

5. Replace this line:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```
   
   With:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi... (your actual key)
   ```

6. Save the file

⚠️ **NEVER commit .env.local to git!**

### Step 3: Test Collectors (2 minutes)

Run these commands:

```bash
# Install TypeScript runner
npm install -D tsx

# Run test
npx tsx test-collectors.ts
```

You should see:
```
✅ Collection complete: 3 collectors, XX events
```

---

## ✅ Success Checklist

- [ ] All 3 migrations applied without errors
- [ ] Service role key added to .env.local
- [ ] Test script runs successfully
- [ ] Events appear in Supabase database

---

## 🆘 If Something Goes Wrong

### Migration Error: "relation already exists"
→ That migration was already applied, skip it

### Migration Error: "permission denied"
→ You need to be the project owner. Check your Supabase account.

### Test Error: "function get_cached_events does not exist"
→ Migration 003 wasn't applied. Go back and apply it.

### Test Error: "permission denied for table events"
→ Service role key is wrong or not set. Double-check .env.local

---

## 🎉 Once Working

Check `IMPLEMENTATION_STATUS.md` for next steps:
- Convert remaining collectors
- Update frontend to use Supabase
- Deploy to production

---

## 📞 Quick Links

- **Supabase Dashboard**: https://supabase.com/dashboard/project/bimfztwwzuwwefxfkkwe
- **SQL Editor**: https://supabase.com/dashboard/project/bimfztwwzuwwefxfkkwe/sql
- **API Settings**: https://supabase.com/dashboard/project/bimfztwwzuwwefxfkkwe/settings/api
- **Table Editor**: https://supabase.com/dashboard/project/bimfztwwzuwwefxfkkwe/editor

---

**Estimated time: 10 minutes total** ⏱️
