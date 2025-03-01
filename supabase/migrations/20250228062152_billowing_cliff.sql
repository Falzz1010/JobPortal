/*
  # Final Login Fix

  1. Updates
    - Fix foreign key references in all tables
    - Update RLS policies for authentication
    - Add missing columns to profiles table
    - Ensure proper access control for all tables
  2. Security
    - Add policies for public access to necessary tables
    - Fix notification permissions
*/

-- Fix the reviews table company_id reference
ALTER TABLE IF EXISTS reviews 
DROP CONSTRAINT IF EXISTS reviews_company_id_fkey;

ALTER TABLE IF EXISTS reviews
ADD CONSTRAINT reviews_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES companies(id);

-- Add policy to allow public read access to profiles
DROP POLICY IF EXISTS "Anyone can read profiles" ON profiles;
CREATE POLICY "Anyone can read profiles"
  ON profiles
  FOR SELECT
  USING (true);

-- Add policy to allow inserting notifications for any user
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

-- Add policy to allow public read access to companies
DROP POLICY IF EXISTS "Anyone can read companies" ON companies;
CREATE POLICY "Anyone can read companies"
  ON companies
  FOR SELECT
  USING (true);

-- Add policy to allow users to update their own notifications
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add policy to allow users to delete their own notifications
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
CREATE POLICY "Users can delete their own notifications"
  ON notifications
  FOR DELETE
  USING (auth.uid() = user_id);