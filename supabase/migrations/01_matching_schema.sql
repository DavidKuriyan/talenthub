-- Requirements (Client Job Postings)
CREATE TABLE requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  client_id UUID REFERENCES users(id) NOT NULL,
  title TEXT NOT NULL,
  skills JSONB NOT NULL DEFAULT '[]', -- e.g. ["React", "Node.js"]
  budget INTEGER, -- in paise
  status TEXT CHECK (status IN ('open', 'closed', 'fulfilled')) DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Profiles (Engineer/Provider details)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL UNIQUE,
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  skills JSONB NOT NULL DEFAULT '[]',
  experience_years INTEGER DEFAULT 0,
  resume_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Matches (Linking Requirements <-> Profiles)
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  requirement_id UUID REFERENCES requirements(id) NOT NULL,
  profile_id UUID REFERENCES profiles(id) NOT NULL,
  score INTEGER DEFAULT 0, -- 0-100 match score
  status TEXT CHECK (status IN ('pending', 'interview_scheduled', 'hired', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Requirements: 
-- Clients can see their own. Admins can see all. Providers can see 'open' ones (optional, maybe only matched ones).
-- For now: Public read for simplicity of matching demo, or tenant-isolation.
CREATE POLICY "Tenant Isolation for Requirements" ON requirements
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Clients can insert their own requirements" ON requirements
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update their own requirements" ON requirements
  FOR UPDATE USING (auth.uid() = client_id);

-- Profiles:
-- Users can read/update their own. Admins read all.
CREATE POLICY "Tenant Isolation for Profiles" ON profiles
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Matches:
-- Visible to relevant Client (via requirement) and Engineer (via profile), and Admin.
CREATE POLICY "Tenant Isolation for Matches" ON matches
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
