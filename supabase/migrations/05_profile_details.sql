-- Migration: Add extended profile details
-- Feature: ENGINEER_PROFILE_ENHANCEMENT

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS education TEXT,
ADD COLUMN IF NOT EXISTS degree TEXT,
ADD COLUMN IF NOT EXISTS university TEXT,
ADD COLUMN IF NOT EXISTS graduation_year INTEGER;

-- Update RLS policies if necessary (though existing ones usually cover full row access)
-- Note: Profiles are already isolated by tenant_id in 01_matching_schema.sql
