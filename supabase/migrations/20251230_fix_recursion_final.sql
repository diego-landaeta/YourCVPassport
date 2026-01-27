-- FINAL FIX: Remove ALL circular dependencies in RLS policies
-- This completely eliminates the infinite recursion issue

-- First, drop ALL existing policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'companies' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON companies';
    END LOOP;
END $$;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'company_users' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON company_users';
    END LOOP;
END $$;

-- ==========================================
-- COMPANIES TABLE - Simple policies without recursion
-- ==========================================

-- Allow ANY authenticated user to insert companies (no restrictions during registration)
CREATE POLICY "Anyone can register companies"
  ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow admins to view all companies
CREATE POLICY "Admins can view all companies"
  ON companies
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow admins to update all companies
CREATE POLICY "Admins can update all companies"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow admins to delete companies
CREATE POLICY "Admins can delete companies"
  ON companies
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ==========================================
-- COMPANY_USERS TABLE - Simple policies without recursion
-- ==========================================

-- Allow users to add themselves as company users (for registration)
CREATE POLICY "Users can join companies"
  ON company_users
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow users to view their own company memberships
CREATE POLICY "Users can view own memberships"
  ON company_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow admins to view all company users
CREATE POLICY "Admins can view all memberships"
  ON company_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow admins to manage all company users
CREATE POLICY "Admins can manage all memberships"
  ON company_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Note: We've removed the circular dependency by NOT having companies policies
-- check company_users table and vice versa during the critical registration flow.
-- Additional policies for viewing/managing can be added later through application logic
-- or by using database functions instead of RLS policies.
