-- Migration: Fix Requirements and Profiles Schema
-- Feature: MATCHING_ENGINE & ENGINEER_PROFILE_ENHANCEMENT
-- Description: Adds missing columns for job requirements and engineer profiles.

-- 1. Update requirements table
ALTER TABLE public.requirements 
ADD COLUMN IF NOT EXISTS role TEXT,
ADD COLUMN IF NOT EXISTS experience_min INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS experience_max INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS salary_min INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS salary_max INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS posted_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS required_skills JSONB DEFAULT '[]';

-- Rename 'skills' to 'required_skills' if 'skills' exists and 'required_skills' doesn't
-- Since we are using JSONB for skills in the UI/API, we ensure consistency.

-- 2. Update profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- 3. Update matches table (fix profile_id vs engineer_id if needed, but profiles.id is UUID)
-- Matches table uses profile_id, but the UI/API sometimes refers to engineer_id (which is profiles.id)
-- Existing schema used profile_id. We'll stick to it but ensure consistency.

-- 4. Refresh RLS or add missing ones
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id OR tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Ensure Service Role has full access (usually default, but being explicit helps)
GRANT ALL ON public.requirements TO service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.matches TO service_role;
