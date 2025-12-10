-- Migration: business schema and RLS for onboarding
-- Description: Ensure business table, columns, constraints and RLS policies

-- 1) Ensure enum type for business status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'business_status') THEN
    CREATE TYPE public.business_status AS ENUM ('draft', 'published');
  END IF;
END
$$;

-- 2) Ensure table exists with core columns
CREATE TABLE IF NOT EXISTS public.business (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  status public.business_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3) Ensure all required columns exist
ALTER TABLE public.business
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS phone_commercial text,
  ADD COLUMN IF NOT EXISTS mobile_commercial text,
  ADD COLUMN IF NOT EXISTS email_commercial text,
  ADD COLUMN IF NOT EXISTS address_street text,
  ADD COLUMN IF NOT EXISTS address_number text,
  ADD COLUMN IF NOT EXISTS address_neighborhood text,
  ADD COLUMN IF NOT EXISTS address_city text,
  ADD COLUMN IF NOT EXISTS address_state text,
  ADD COLUMN IF NOT EXISTS address_zip text,
  ADD COLUMN IF NOT EXISTS address_complement text;

-- 4) Ensure NOT NULL constraints on mandatory fields
ALTER TABLE public.business
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN description SET NOT NULL,
  ALTER COLUMN phone_commercial SET NOT NULL,
  ALTER COLUMN email_commercial SET NOT NULL,
  ALTER COLUMN address_street SET NOT NULL,
  ALTER COLUMN address_number SET NOT NULL,
  ALTER COLUMN address_neighborhood SET NOT NULL,
  ALTER COLUMN address_city SET NOT NULL,
  ALTER COLUMN address_state SET NOT NULL,
  ALTER COLUMN address_zip SET NOT NULL;

-- 5) Ensure unique business per tenant
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'business_tenant_unique'
      AND conrelid = 'public.business'::regclass
  ) THEN
    ALTER TABLE public.business
      ADD CONSTRAINT business_tenant_unique UNIQUE (tenant_id);
  END IF;
END
$$;

-- Optional: ensure tenant_id references accounts table (adjust if needed)
-- ALTER TABLE public.business
--   ADD CONSTRAINT business_tenant_fk
--   FOREIGN KEY (tenant_id) REFERENCES public.accounts(id);

-- 6) Enable and enforce RLS
ALTER TABLE public.business ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business FORCE ROW LEVEL SECURITY;

-- 7) Drop existing policies on business and recreate secure ones
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'business'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.business;', pol.policyname);
  END LOOP;
END
$$;

-- 8) Policies: tenant can only see / mutate own business
CREATE POLICY business_select_own
  ON public.business
  FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY business_insert_own
  ON public.business
  FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY business_update_own
  ON public.business
  FOR UPDATE
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY business_delete_own
  ON public.business
  FOR DELETE
  USING (tenant_id = auth.uid());
