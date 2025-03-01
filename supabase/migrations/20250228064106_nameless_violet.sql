-- Fix the reviews table company_id and reviewer_id references
ALTER TABLE IF EXISTS reviews 
DROP CONSTRAINT IF EXISTS reviews_company_id_fkey;

ALTER TABLE IF EXISTS reviews
ADD CONSTRAINT reviews_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES companies(id);

ALTER TABLE IF EXISTS reviews 
DROP CONSTRAINT IF EXISTS reviews_reviewer_id_fkey;

ALTER TABLE IF EXISTS reviews
ADD CONSTRAINT reviews_reviewer_id_fkey 
FOREIGN KEY (reviewer_id) REFERENCES auth.users(id);

-- Fix the reviews table structure to match the expected query pattern
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