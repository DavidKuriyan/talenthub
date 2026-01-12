-- TalentHub User Sync Migration
-- Ensures public.users table exists and stays in sync with auth.users

-- 1. Ensure public.users table exists with correct schema
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id),
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'provider', 'subscriber', 'super_admin')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS on public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Create Sync Trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, tenant_id, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    (NEW.raw_user_meta_data->>'tenant_id')::uuid, 
    COALESCE(NEW.raw_user_meta_data->>'role', 'subscriber')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    tenant_id = EXCLUDED.tenant_id,
    role = EXCLUDED.role;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Create Sync existing users function (utility)
CREATE OR REPLACE FUNCTION public.sync_existing_users()
RETURNS void AS $$
BEGIN
  INSERT INTO public.users (id, email, tenant_id, role)
  SELECT 
    id, 
    email, 
    (raw_user_meta_data->>'tenant_id')::uuid, 
    COALESCE(raw_user_meta_data->>'role', 'subscriber')
  FROM auth.users
  ON CONFLICT (id) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    role = EXCLUDED.role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Add super_admin role check if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        -- skipping type creation if already using TEXT with CHECK
    END IF;
END $$;
