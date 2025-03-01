/*
  # Add public access to companies table

  1. Changes
    - Add policy to allow public read access to companies
*/

-- Add policy to allow public read access to companies
DROP POLICY IF EXISTS "Anyone can read companies" ON companies;
CREATE POLICY "Anyone can read companies"
  ON companies
  FOR SELECT
  USING (true);