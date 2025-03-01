/*
  # Fix Login Issues

  1. Changes
     - Fix the reviews table company_id reference
     - Update RLS policies for all tables to ensure proper access
     - Add missing policies for notifications and profiles
     - Ensure proper authentication flow
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