# 🔧 Quick Fix Guide: "No Products Found"

## Problem
You're seeing "No products found for this tenant" on the products page.

## Root Cause
The database is empty - you haven't run the seed script yet.

## ✅ Solution (5 minutes)

### Step 1: Open Supabase Dashboard
1. Go to https://app.supabase.com
2. Select your project
3. Click **SQL Editor** in left sidebar

### Step 2: Run Seed Script
1. Click **+ New query**
2. Open file on your computer: `d:\Boot Camp\TalentHub\supabase\seed.sql`
3. **Copy ALL contents** (Ctrl+A, Ctrl+C)
4. **Paste** into Supabase SQL Editor (Ctrl+V)
5. Click **RUN** button (▶️ icon)

### Step 3: Verify
You should see: **"Success. 6 rows returned"**

Run this verification query:
```sql
SELECT 
  t.name as tenant,
  p.name as product,
  p.price / 100 as price
FROM products p
JOIN tenants t ON p.tenant_id = t.id;
```

Expected output: 6 products
- TalentHub Solutions: React Developer (₹8000), Node.js Developer (₹7500), Full Stack Developer (₹9000)
- TechStaff Co: Junior Developer (₹5000), Senior Developer (₹10000), Tech Lead (₹15000)

### Step 4: Refresh Browser
1. Go back to http://localhost:3000/products
2. Press F5 or Ctrl+R
3. **You should now see 3-6 products!** ✅

---

## Still Not Working?

### Run Diagnostics
1. In Supabase SQL Editor, open `d:\Boot Camp\TalentHub\supabase\diagnostics.sql`
2. Run the entire file
3. Check the output for each diagnostic test
4. Follow the fix suggestions provided

### Common Issues

#### Issue 1: RLS Blocking Queries
**Symptom**: Products exist in database but page shows "No products found"

**Fix**: Run this in Supabase SQL Editor:
```sql
-- Temporarily allow all users to read products
CREATE POLICY "temp_allow_all_products" ON products
  FOR SELECT
  TO authenticated
  USING (true);
```

#### Issue 2: Seed Script Fails
**Symptom**: Error when running seed.sql

**Fix**: Tables might not exist. Run database schema first (from README.md):
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Then run seed.sql again.

#### Issue 3: "No Tenant Selected"
**Symptom**: Logged in but no tenant_id in session

**Fix**: During registration/login, ensure tenant_id is set in app_metadata:
```typescript
// In registration flow
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      tenant_id: 'talenthub' // or from tenant selection
    }
  }
});
```

---

## Need More Help?

Check these files:
- `supabase/README.md` - Full database setup guide
- `supabase/diagnostics.sql` - Automated diagnostic tests
- `DEPLOYMENT.md` - Production deployment guide

Or check server logs:
```bash
# In terminal where dev server is running
# Look for console.log output with products count
```

---

**TL;DR**: Run `supabase/seed.sql` in Supabase SQL Editor, then refresh browser. Done! 🎉
