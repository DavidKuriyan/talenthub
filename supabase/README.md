# Database Setup Instructions

## 🎯 Quick Start

### Option 1: Run Seed Script in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to: **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the contents of `supabase/seed.sql`
5. Paste into the editor
6. Click **Run** button

### Option 2: Use Supabase CLI

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations and seed
supabase db push
```

## ✅ Verify Seed Data

After running the seed script, verify with:

```sql
-- Check tenants
SELECT * FROM tenants;

-- Check products
SELECT 
  t.name as tenant,
  p.name as product,
  p.price / 100 as price_rupees
FROM products p
JOIN tenants t ON p.tenant_id = t.id
ORDER BY t.name, p.price;
```

Expected: 2 tenants, 6 products (3 per tenant)

## 🐛 Troubleshooting

### "No products found for this tenant"

**Cause**: Either products table is empty OR the user's `tenant_id` doesn't match

**Fix 1: Run seed script** (see above)

**Fix 2: Check user's tenant_id**
```sql
SELECT 
  u.email,
  u.tenant_id,
  t.slug
FROM users u
LEFT JOIN tenants t ON u.tenant_id = t.id
WHERE u.id = 'your-user-id';
```

**Fix 3: Assign user to correct tenant**
```sql
UPDATE users
SET tenant_id = (SELECT id FROM tenants WHERE slug = 'talenthub')
WHERE email = 'your-email@example.com';
```

### RLS Blocking Queries

If you see permission errors:

```sql
-- Temporarily disable RLS for testing (DEVELOPMENT ONLY!)
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- Check if products exist
SELECT COUNT(*) FROM products;

-- Re-enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
```

### Missing tenant_id in JWT

If authenticated user doesn't have `tenant_id` in their JWT:

1. Check Supabase Auth settings
2. Ensure you're setting `app_metadata.tenant_id` during registration
3. Or use default tenant: `talenthub`

## 📊 Product Pricing Reference

All prices are in **paise** (1 Rupee = 100 paise):

| Product | Price (₹) | Price (paise) |
|---------|-----------|---------------|
| React Developer | ₹8,000 | 800,000 |
| Node.js Developer | ₹7,500 | 750,000 |
| Full Stack Developer | ₹9,000 | 900,000 |
| Junior Developer | ₹5,000 | 500,000 |
| Senior Developer | ₹10,000 | 1,000,000 |
| Tech Lead | ₹15,000 | 1,500,000 |

## 🔄 Reset Database (Development Only)

```sql
-- WARNING: This deletes ALL data!
TRUNCATE products, orders, messages, audit_logs CASCADE;
TRUNCATE tenants CASCADE;

-- Then re-run seed.sql
```
