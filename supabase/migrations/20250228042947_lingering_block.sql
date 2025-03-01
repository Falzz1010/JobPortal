/*
  # Complete database schema setup

  1. Tables
    - Ensures all required tables exist with proper structure
    - Sets up proper relationships between tables
    - Adds all necessary columns for each table
  
  2. Security
    - Enables Row Level Security on all tables
    - Creates appropriate policies for each table
    - Ensures proper access control for different user types
  
  3. Utilities
    - Creates function and triggers for automatic timestamp updates
*/

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  user_type text NOT NULL,
  bio text,
  resume_url text,
  skills text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create companies table if it doesn't exist
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  logo_url text,
  website text,
  description text NOT NULL,
  industry text NOT NULL,
  location text,
  founded_year integer,
  company_size text,
  social_media jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create jobs table if it doesn't exist
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  company_id uuid NOT NULL,
  location text NOT NULL,
  salary_range text NOT NULL,
  job_type text NOT NULL,
  requirements text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  CONSTRAINT jobs_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Create applications table if it doesn't exist
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs NOT NULL,
  applicant_id uuid REFERENCES auth.users NOT NULL,
  resume_url text NOT NULL,
  cover_letter text NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bookmarks table if it doesn't exist
CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  job_id uuid REFERENCES jobs NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, job_id)
);

-- Create reviews table if it doesn't exist
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES auth.users NOT NULL,
  reviewer_id uuid REFERENCES auth.users NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text NOT NULL,
  content text NOT NULL,
  pros text,
  cons text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, reviewer_id)
);

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  read boolean DEFAULT false,
  related_id text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
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

-- Companies policies
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

-- Jobs policies
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

-- Applications policies
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

-- Bookmarks policies
DROP POLICY IF EXISTS "Users can read their own bookmarks" ON bookmarks;
CREATE POLICY "Users can read their own bookmarks"
  ON bookmarks
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own bookmarks" ON bookmarks;
CREATE POLICY "Users can insert their own bookmarks"
  ON bookmarks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON bookmarks;
CREATE POLICY "Users can delete their own bookmarks"
  ON bookmarks
  FOR DELETE
  USING (auth.uid() = user_id);

-- Reviews policies
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

-- Notifications policies
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

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update updated_at column
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON companies
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
CREATE TRIGGER update_jobs_updated_at
BEFORE UPDATE ON jobs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_applications_updated_at ON applications;
CREATE TRIGGER update_applications_updated_at
BEFORE UPDATE ON applications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();