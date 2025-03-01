/*
  # Initial schema for Job Portal

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `full_name` (text)
      - `avatar_url` (text, nullable)
      - `user_type` (text)
      - `bio` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    - `companies`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `logo_url` (text, nullable)
      - `website` (text, nullable)
      - `description` (text)
      - `industry` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    - `jobs`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `company_id` (uuid, references companies)
      - `location` (text)
      - `salary_range` (text)
      - `job_type` (text)
      - `requirements` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `is_active` (boolean)
    - `applications`
      - `id` (uuid, primary key)
      - `job_id` (uuid, references jobs)
      - `applicant_id` (uuid, references auth.users)
      - `resume_url` (text)
      - `cover_letter` (text)
      - `status` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read and write their own data
    - Add policies for companies to read applications for their jobs
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  user_type text NOT NULL,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  logo_url text,
  website text,
  description text NOT NULL,
  industry text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  company_id uuid REFERENCES auth.users NOT NULL,
  location text NOT NULL,
  salary_range text NOT NULL,
  job_type text NOT NULL,
  requirements text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Create applications table
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

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read their own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Companies policies
CREATE POLICY "Companies can read their own company"
  ON companies
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Companies can update their own company"
  ON companies
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Companies can insert their own company"
  ON companies
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Jobs policies
CREATE POLICY "Anyone can read active jobs"
  ON jobs
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Companies can read all their jobs"
  ON jobs
  FOR SELECT
  USING (auth.uid() = company_id);

CREATE POLICY "Companies can insert their own jobs"
  ON jobs
  FOR INSERT
  WITH CHECK (auth.uid() = company_id);

CREATE POLICY "Companies can update their own jobs"
  ON jobs
  FOR UPDATE
  USING (auth.uid() = company_id);

CREATE POLICY "Companies can delete their own jobs"
  ON jobs
  FOR DELETE
  USING (auth.uid() = company_id);

-- Applications policies
CREATE POLICY "Companies can read applications for their jobs"
  ON applications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = applications.job_id
      AND jobs.company_id = auth.uid()
    )
  );

CREATE POLICY "Applicants can read their own applications"
  ON applications
  FOR SELECT
  USING (auth.uid() = applicant_id);

CREATE POLICY "Applicants can insert their own applications"
  ON applications
  FOR INSERT
  WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Companies can update application status"
  ON applications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = applications.job_id
      AND jobs.company_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update updated_at column
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON companies
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
BEFORE UPDATE ON jobs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
BEFORE UPDATE ON applications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();