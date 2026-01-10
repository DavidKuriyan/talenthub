-- TalentHub Extended Schema
-- Adds interviews, offer_letters, invoices tables and availability field

-- ==================== PROFILE AVAILABILITY ====================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS availability TEXT 
  CHECK (availability IN ('available', 'busy', 'unavailable')) DEFAULT 'available';

-- ==================== INTERVIEWS TABLE ====================
CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  match_id UUID REFERENCES matches(id) NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  jitsi_room_id TEXT NOT NULL,
  status TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==================== OFFER LETTERS TABLE ====================
CREATE TABLE IF NOT EXISTS offer_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  match_id UUID REFERENCES matches(id) NOT NULL,
  salary INTEGER NOT NULL, -- in paise
  start_date DATE NOT NULL,
  document_url TEXT,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==================== INVOICES/PAYMENTS TABLE ====================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  match_id UUID REFERENCES matches(id),
  engineer_id UUID REFERENCES users(id),
  amount INTEGER NOT NULL, -- in paise
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  status TEXT CHECK (status IN ('pending', 'paid', 'failed')) DEFAULT 'pending',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==================== RLS POLICIES ====================
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Interviews: Tenant isolation
CREATE POLICY "Tenant Isolation for Interviews" ON interviews 
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Users can view their interviews" ON interviews
  FOR SELECT USING (
    match_id IN (
      SELECT m.id FROM matches m 
      JOIN profiles p ON m.profile_id = p.id 
      WHERE p.user_id = auth.uid()
    )
  );

-- Offer Letters: Tenant isolation
CREATE POLICY "Tenant Isolation for Offer Letters" ON offer_letters 
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Engineers view their offers" ON offer_letters
  FOR SELECT USING (
    match_id IN (
      SELECT m.id FROM matches m 
      JOIN profiles p ON m.profile_id = p.id 
      WHERE p.user_id = auth.uid()
    )
  );

-- Invoices: Tenant isolation
CREATE POLICY "Tenant Isolation for Invoices" ON invoices 
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Engineers view their payments" ON invoices
  FOR SELECT USING (engineer_id = auth.uid());

-- ==================== INDEXES ====================
CREATE INDEX IF NOT EXISTS idx_interviews_match ON interviews(match_id);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);
CREATE INDEX IF NOT EXISTS idx_offer_letters_match ON offer_letters(match_id);
CREATE INDEX IF NOT EXISTS idx_offer_letters_status ON offer_letters(status);
CREATE INDEX IF NOT EXISTS idx_invoices_engineer ON invoices(engineer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_profiles_availability ON profiles(availability);
