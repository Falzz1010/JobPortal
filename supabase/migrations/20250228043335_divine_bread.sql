/*
  # Fix reviews table company_id reference

  1. Changes
    - Update reviews table to reference companies(id) instead of auth.users
    - Add public access policy for companies table
*/

-- Fix the reviews table company_id reference
ALTER TABLE IF EXISTS reviews 
DROP CONSTRAINT IF EXISTS reviews_company_id_fkey;

ALTER TABLE IF EXISTS reviews
ADD CONSTRAINT reviews_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES companies(id);

-- Add policy to allow public read access to companies
DROP POLICY IF EXISTS "Anyone can read companies" ON companies;
CREATE POLICY "Anyone can read companies"
  ON companies
  FOR SELECT
  USING (true);