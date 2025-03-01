/*
  # Fix Applications and Profiles Relationship

  1. Changes
     - Add foreign key relationship between applications.applicant_id and profiles.user_id
     - Modify the query structure to properly join applications with profiles
     - Update RLS policies to ensure proper access control
  
  2. Security
     - Maintain existing RLS policies
     - Ensure proper access control for applications data
*/

-- Fix the relationship between applications and profiles
ALTER TABLE IF EXISTS applications
DROP CONSTRAINT IF EXISTS applications_applicant_id_fkey;

-- Re-add the constraint to reference auth.users directly
ALTER TABLE applications
ADD CONSTRAINT applications_applicant_id_fkey
FOREIGN KEY (applicant_id) REFERENCES auth.users(id);

-- Update applications query structure
-- Instead of using the nested select with profiles, we'll modify the EmployerDashboard component
-- to fetch applicant data separately after getting applications

-- Ensure proper RLS for applications table
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

DROP POLICY IF EXISTS "Applicants can read their own applications" ON applications;
CREATE POLICY "Applicants can read their own applications"
  ON applications
  FOR SELECT
  USING (auth.uid() = applicant_id);

DROP POLICY IF EXISTS "Applicants can insert their own applications" ON applications;
CREATE POLICY "Applicants can insert their own applications"
  ON applications
  FOR INSERT
  WITH CHECK (auth.uid() = applicant_id);

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