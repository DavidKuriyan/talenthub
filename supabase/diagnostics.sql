/**
 * Database Diagnostic Tool
 * Run this in Supabase SQL Editor to diagnose issues
 */

-- =====================================================
-- DIAGNOSTIC 1: Check if tenants exist
-- =====================================================
SELECT 'TENANTS CHECK' as test, COUNT(*) as count FROM tenants;
SELECT * FROM tenants;

-- Expected: 2 rows (talenthub, techstaff)
-- If 0: Run seed.sql first!

-- =====================================================
-- DIAGNOSTIC 2: Check if products exist
-- =====================================================
SELECT 'PRODUCTS CHECK' as test, COUNT(*) as count FROM products;
SELECT 
    t.name as tenant,
    p.name as product,
    p.price / 100 as price_rupees
FROM products p
JOIN tenants t ON p.tenant_id = t.id
ORDER BY t.name;

-- Expected: 6 rows (3 per tenant)
-- If 0: Run seed.sql!

-- =====================================================
-- DIAGNOSTIC 3: Check RLS policies
-- =====================================================
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'products';

-- Expected: At least 1 policy
-- If empty: RLS not configured properly

-- =====================================================
-- DIAGNOSTIC 4: Test query WITHOUT RLS (admin bypass)
-- =====================================================
SET ROLE postgres;
SELECT * FROM products;
RESET ROLE;

-- This should show all products regardless of tenant

-- =====================================================
-- DIAGNOSTIC 5: Check if RLS is enabled
-- =====================================================
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('products', 'tenants', 'orders');

-- Expected: rowsecurity = true for all tables

-- =====================================================
-- FIX 1: If products are empty, insert seed data
-- =====================================================
-- Run this if products count is 0:

INSERT INTO tenants (name, slug, is_active) VALUES
  ('TalentHub Solutions', 'talenthub', true),
  ('TechStaff Co', 'techstaff', true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (tenant_id, name, price) VALUES
  ((SELECT id FROM tenants WHERE slug = 'talenthub'), 'React Developer Placement', 800000),
  ((SELECT id FROM tenants WHERE slug = 'talenthub'), 'Node.js Developer Placement', 750000),
  ((SELECT id FROM tenants WHERE slug = 'talenthub'), 'Full Stack Developer Placement', 900000),
  ((SELECT id FROM tenants WHERE slug = 'techstaff'), 'Junior Developer Placement', 500000),
  ((SELECT id FROM tenants WHERE slug = 'techstaff'), 'Senior Developer Placement', 1000000),
  ((SELECT id FROM tenants WHERE slug = 'techstaff'), 'Tech Lead Placement', 1500000)
ON CONFLICT DO NOTHING;

-- =====================================================
-- FIX 2: If RLS is blocking, temporarily disable for testing
-- =====================================================
-- WARNING: DEVELOPMENT ONLY!
-- ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- Test query again
-- SELECT * FROM products;

-- Re-enable RLS
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- DIAGNOSTIC 6: Check current user's tenant_id
-- =====================================================
-- This shows what tenant_id the current JWT has
SELECT current_user, current_setting('request.jwt.claims', true)::json;

-- =====================================================
-- RESULTS INTERPRETATION
-- =====================================================
/*
SCENARIO 1: Tenants count = 0, Products count = 0
FIX: Run the INSERT statements above (FIX 1)

SCENARIO 2: Products exist but page shows "No products found"
CAUSE: RLS is blocking the query
FIX A: Ensure user's JWT has tenant_id claim
FIX B: Create proper RLS policy:

CREATE POLICY "Allow read access to products" ON products
  FOR SELECT
  USING (true);  -- Temporarily allow all reads for testing

SCENARIO 3: RLS policies missing
FIX: Add RLS policies (see README.md section on RLS)

SCENARIO 4: Products exist but wrong tenant
FIX: Check tenant_id in products matches your user's tenant_id
*/

-- =====================================================
-- QUICK FIX: Create permissive RLS policy for testing
-- =====================================================
-- This allows all authenticated users to read all products
-- Replace with proper tenant-scoped policy later

DROP POLICY IF EXISTS "temp_allow_all_products" ON products;

CREATE POLICY "temp_allow_all_products" ON products
  FOR SELECT
  TO authenticated
  USING (true);

-- Now test: SELECT * FROM products;
-- Should show all 6 products

-- =====================================================
-- FINAL VERIFICATION
-- =====================================================
SELECT 
    'FINAL CHECK' as status,
    (SELECT COUNT(*) FROM tenants) as tenants,
    (SELECT COUNT(*) FROM products) as products,
    CASE 
        WHEN (SELECT COUNT(*) FROM products) >= 6 THEN '✅ FIXED'
        ELSE '❌ STILL BROKEN'
    END as result;
