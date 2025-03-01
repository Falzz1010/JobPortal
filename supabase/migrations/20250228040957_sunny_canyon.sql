/*
  # Fix foreign key constraints and database schema

  1. Changes
     - Fix the jobs table foreign key reference to point to companies(id) instead of auth.users
     - Update RLS policies to work with the corrected schema
     - Add missing columns to profiles and companies tables
*/

-- Fix the jobs table foreign key reference
ALTER TABLE IF EXISTS jobs 
DROP CONSTRAINT IF EXISTS jobs_company_id_fkey;

ALTER TABLE IF EXISTS jobs
ADD CONSTRAINT jobs_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES companies(id);

-- Add missing columns to profiles if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'resume_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN resume_url text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'skills'
  ) THEN
    ALTER TABLE profiles ADD COLUMN skills text[];
  END IF;
END $$;

-- Add missing columns to companies if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'location'
  ) THEN
    ALTER TABLE companies ADD COLUMN location text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'founded_year'
  ) THEN
    ALTER TABLE companies ADD COLUMN founded_year integer;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'company_size'
  ) THEN
    ALTER TABLE companies ADD COLUMN company_size text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'social_media'
  ) THEN
    ALTER TABLE companies ADD COLUMN social_media jsonb;
  END IF;
END $$;

-- Update RLS policies for jobs table
DROP POLICY IF EXISTS "Anyone can read active jobs" ON jobs;
CREATE POLICY "Anyone can read active jobs"
  ON jobs
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Companies can read all their jobs" ON jobs;
CREATE POLICY "Companies can read all their jobs"
  ON jobs
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM companies 
    WHERE companies.id = jobs.company_id 
    AND companies.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Companies can insert their own jobs" ON jobs;
CREATE POLICY "Companies can insert their own jobs"
  ON jobs
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM companies 
    WHERE companies.id = jobs.company_id 
    AND companies.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Companies can update their own jobs" ON jobs;
CREATE POLICY "Companies can update their own jobs"
  ON jobs
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM companies 
    WHERE companies.id = jobs.company_id 
    AND companies.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Companies can delete their own jobs" ON jobs;
CREATE POLICY "Companies can delete their own jobs"
  ON jobs
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM companies 
    WHERE companies.id = jobs.company_id 
    AND companies.user_id = auth.uid()
  ));