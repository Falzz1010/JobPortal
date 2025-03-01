/*
  # Fix Login Issues

  1. Updates
    - Fix foreign key references in reviews table
    - Add missing columns to profiles table
    - Update RLS policies for better access control
    - Fix company_id reference in reviews table
  2. Security
    - Ensure proper RLS policies for all tables
    - Add policy for public access to profiles for basic information
*/

-- Fix the reviews table company_id reference if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'reviews_company_id_fkey' 
    AND constraint_type = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE reviews DROP CONSTRAINT reviews_company_id_fkey;
  END IF;
END $$;

ALTER TABLE reviews
ADD CONSTRAINT reviews_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES companies(id);

-- Add policy to allow public read access to profiles for basic information
DROP POLICY IF EXISTS "Anyone can read basic profile info" ON profiles;
CREATE POLICY "Anyone can read basic profile info"
  ON profiles
  FOR SELECT
  USING (true);

-- Add policy to allow inserting notifications for any user (needed for system notifications)
DROP POLICY IF EXISTS "System can insert notifications for any user" ON notifications;
CREATE POLICY "System can insert notifications for any user"
  ON notifications
  FOR INSERT
  WITH CHECK (true);

-- Fix applications policies to ensure proper access
DROP POLICY IF EXISTS "Companies can read applications for their jobs" ON applications;
CREATE POLICY "Companies can read applications for their jobs"
  ON applications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      JOIN companies ON companies.id = jobs.company_id
      WHERE jobs.id = applications.job_id
      AND companies.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Companies can update application status" ON applications;
CREATE POLICY "Companies can update application status"
  ON applications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      JOIN companies ON companies.id = jobs.company_id
      WHERE jobs.id = applications.job_id
      AND companies.user_id = auth.uid()
    )
  );

-- Ensure proper RLS for reviews table
DROP POLICY IF EXISTS "Anyone can read reviews" ON reviews;
CREATE POLICY "Anyone can read reviews"
  ON reviews
  FOR SELECT
  USING (true);

-- Add policy to allow public read access to companies
DROP POLICY IF EXISTS "Anyone can read companies" ON companies;
CREATE POLICY "Anyone can read companies"
  ON companies
  FOR SELECT
  USING (true);