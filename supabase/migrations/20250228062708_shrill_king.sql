/*
  # Fix Login Permissions

  1. Changes
     - Fix auth policies for profiles table
     - Fix auth policies for companies table
     - Fix auth policies for notifications table
     - Ensure proper RLS for all tables
     - Add missing policies for proper authentication flow
*/

-- Ensure proper RLS for all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Fix profiles policies
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
CREATE POLICY "Users can read their own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can read profiles" ON profiles;
CREATE POLICY "Anyone can read profiles"
  ON profiles
  FOR SELECT
  USING (true);

-- Fix companies policies
DROP POLICY IF EXISTS "Companies can read their own company" ON companies;
CREATE POLICY "Companies can read their own company"
  ON companies
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Companies can update their own company" ON companies;
CREATE POLICY "Companies can update their own company"
  ON companies
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Companies can insert their own company" ON companies;
CREATE POLICY "Companies can insert their own company"
  ON companies
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can read companies" ON companies;
CREATE POLICY "Anyone can read companies"
  ON companies
  FOR SELECT
  USING (true);

-- Fix notifications policies
DROP POLICY IF EXISTS "Users can read their own notifications" ON notifications;
CREATE POLICY "Users can read their own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
CREATE POLICY "Users can delete their own notifications"
  ON notifications
  FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert notifications for themselves" ON notifications;
CREATE POLICY "Users can insert notifications for themselves"
  ON notifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can insert notifications" ON notifications;
CREATE POLICY "Anyone can insert notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (true);

-- Fix applications policies
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

-- Fix reviews table company_id reference
ALTER TABLE IF EXISTS reviews 
DROP CONSTRAINT IF EXISTS reviews_company_id_fkey;

ALTER TABLE IF EXISTS reviews
ADD CONSTRAINT reviews_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES companies(id);

-- Fix reviews policies
DROP POLICY IF EXISTS "Anyone can read reviews" ON reviews;
CREATE POLICY "Anyone can read reviews"
  ON reviews
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own reviews" ON reviews;
CREATE POLICY "Users can insert their own reviews"
  ON reviews
  FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
CREATE POLICY "Users can update their own reviews"
  ON reviews
  FOR UPDATE
  USING (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "Users can delete their own reviews" ON reviews;
CREATE POLICY "Users can delete their own reviews"
  ON reviews
  FOR DELETE
  USING (auth.uid() = reviewer_id);