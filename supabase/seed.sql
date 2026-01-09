-- TalentHub Database Seed Data
-- Based on README.md requirements for multi-tenant marketplace
-- Products are placement services for manpower consultancy agencies

-- ==================== TENANTS ====================
-- Create two demo tenants as specified in README

INSERT INTO tenants (name, slug, is_active) VALUES
  ('TalentHub Solutions', 'talenthub', true),
  ('TechStaff Co', 'techstaff', true)
ON CONFLICT (slug) DO NOTHING;

-- ==================== PRODUCTS ====================
-- Add placement services per tenant (prices in paise: ₹8000 = 800000 paise)
-- Based on README line 424-429

INSERT INTO products (tenant_id, name, price) VALUES
  -- TalentHub Solutions products
  (
    (SELECT id FROM tenants WHERE slug = 'talenthub'),
    'React Developer Placement',
    800000  -- ₹8,000
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'talenthub'),
    'Node.js Developer Placement',
    750000  -- ₹7,500
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'talenthub'),
    'Full Stack Developer Placement',
    900000  -- ₹9,000
  ),
  
  -- TechStaff Co products
  (
    (SELECT id FROM tenants WHERE slug = 'techstaff'),
    'Junior Developer Placement',
    500000  -- ₹5,000
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'techstaff'),
    'Senior Developer Placement',
    1000000 -- ₹10,000
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'techstaff'),
    'Tech Lead Placement',
    1500000 -- ₹15,000
  )
ON CONFLICT DO NOTHING;

-- ==================== VERIFICATION ====================
-- Verify data was inserted correctly

SELECT 
  t.name as tenant_name,
  p.name as product_name,
  p.price / 100 as price_in_rupees,
  p.created_at
FROM products p
JOIN tenants t ON p.tenant_id = t.id
ORDER BY t.name, p.price;

-- Expected output:
-- TalentHub Solutions | Node.js Developer Placement | 7500 | ...
-- TalentHub Solutions | React Developer Placement | 8000 | ...
-- TalentHub Solutions | Full Stack Developer Placement | 9000 | ...
-- TechStaff Co | Junior Developer Placement | 5000 | ...
-- TechStaff Co | Senior Developer Placement | 10000 | ...
-- TechStaff Co | Tech Lead Placement | 15000 | ...
