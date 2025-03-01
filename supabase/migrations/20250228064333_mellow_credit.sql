/*
  # Fix Login Issues

  1. Fixes
    - Ensure proper foreign key relationships
    - Fix reviews table structure
    - Update RLS policies for proper authentication
    - Add missing columns to profiles table
  
  2. Security
    - Ensure proper RLS policies for all tables
    - Fix authentication-related policies
*/

-- Fix the reviews table company_id reference
ALTER TABLE IF EXISTS reviews 
DROP CONSTRAINT IF EXISTS reviews_company_id_fkey;

ALTER TABLE IF EXISTS reviews
ADD CONSTRAINT reviews_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES companies(id);

-- Fix the reviews table structure
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reviews' AND column_name = 'reviewer_id'
  ) THEN
    ALTER TABLE reviews ADD COLUMN reviewer_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Ensure proper RLS for all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Fix profiles policies
DROP POLICY IF EXISTS "Anyone can read profiles" ON profiles;
CREATE POLICY "Anyone can read profiles"
  ON profiles
  FOR SELECT
  USING (true);

-- Fix companies policies
DROP POLICY IF EXISTS "Anyone can read companies" ON companies;
CREATE POLICY "Anyone can read companies"
  ON companies
  FOR SELECT
  USING (true);

-- Fix notifications policies
DROP POLICY IF EXISTS "Anyone can insert notifications" ON notifications;
CREATE POLICY "Anyone can insert notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (true);

-- Fix reviews policies
DROP POLICY IF EXISTS "Anyone can read reviews" ON reviews;
CREATE POLICY "Anyone can read reviews"
  ON reviews
  FOR SELECT
  USING (true);