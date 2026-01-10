-- TalentHub Database Seed Data
-- Based on README.md requirements for multi-tenant marketplace
-- 5 agencies with domain-specific products

-- ==================== TENANTS ====================
-- Create 5 demo tenants as specified in presentation slides

INSERT INTO tenants (name, slug, is_active) VALUES
  ('TalentHub Solutions', 'talenthub', true),
  ('TechStaff Co', 'techstaff', true),
  ('StaffEasy', 'staffeasy', true),
  ('EduStaff', 'edustaff', true),
  ('HealthForce', 'healthforce', true)
ON CONFLICT (slug) DO NOTHING;

-- ==================== PRODUCTS ====================
-- Domain-specific placement services per tenant (prices in paise)

-- TalentHub Solutions (Chennai IT)
INSERT INTO products (tenant_id, name, price) VALUES
  ((SELECT id FROM tenants WHERE slug = 'talenthub'), 'React Developer Placement', 800000),
  ((SELECT id FROM tenants WHERE slug = 'talenthub'), 'Node.js Developer Placement', 750000),
  ((SELECT id FROM tenants WHERE slug = 'talenthub'), 'Full Stack Developer Placement', 900000)
ON CONFLICT DO NOTHING;

-- TechStaff Co (Chennai IT - Competitor)
INSERT INTO products (tenant_id, name, price) VALUES
  ((SELECT id FROM tenants WHERE slug = 'techstaff'), 'Junior Developer Placement', 500000),
  ((SELECT id FROM tenants WHERE slug = 'techstaff'), 'Senior Developer Placement', 1000000),
  ((SELECT id FROM tenants WHERE slug = 'techstaff'), 'Tech Lead Placement', 1500000)
ON CONFLICT DO NOTHING;

-- StaffEasy (Coimbatore Manufacturing)
INSERT INTO products (tenant_id, name, price) VALUES
  ((SELECT id FROM tenants WHERE slug = 'staffeasy'), 'CNC Operator Placement', 350000),
  ((SELECT id FROM tenants WHERE slug = 'staffeasy'), 'Welder Placement', 300000),
  ((SELECT id FROM tenants WHERE slug = 'staffeasy'), 'Production Manager Placement', 600000)
ON CONFLICT DO NOTHING;

-- EduStaff (Engineering College Placements)
INSERT INTO products (tenant_id, name, price) VALUES
  ((SELECT id FROM tenants WHERE slug = 'edustaff'), 'Lecturer Placement', 450000),
  ((SELECT id FROM tenants WHERE slug = 'edustaff'), 'Lab Assistant Placement', 250000),
  ((SELECT id FROM tenants WHERE slug = 'edustaff'), 'HOD Placement', 800000)
ON CONFLICT DO NOTHING;

-- HealthForce (Nursing Agencies)
INSERT INTO products (tenant_id, name, price) VALUES
  ((SELECT id FROM tenants WHERE slug = 'healthforce'), 'Staff Nurse Placement', 400000),
  ((SELECT id FROM tenants WHERE slug = 'healthforce'), 'ICU Nurse Placement', 550000),
  ((SELECT id FROM tenants WHERE slug = 'healthforce'), 'Nursing Supervisor Placement', 700000)
ON CONFLICT DO NOTHING;

-- ==================== VERIFICATION ====================
SELECT 
  t.name as tenant_name,
  t.slug as tenant_slug,
  COUNT(p.id) as product_count,
  SUM(p.price) / 100 as total_value_rupees
FROM tenants t
LEFT JOIN products p ON p.tenant_id = t.id
GROUP BY t.id, t.name, t.slug
ORDER BY t.name;

-- Expected output:
-- EduStaff | edustaff | 3 | 15000
-- HealthForce | healthforce | 3 | 16500
-- StaffEasy | staffeasy | 3 | 12500
-- TalentHub Solutions | talenthub | 3 | 24500
-- TechStaff Co | techstaff | 3 | 30000
