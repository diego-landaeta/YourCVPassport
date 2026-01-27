-- Fix RLS policies for company registration
-- This migration adds the necessary policies to allow company registration

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own company" ON companies;
DROP POLICY IF EXISTS "Users can view their own company" ON companies;
DROP POLICY IF EXISTS "Admins can view all companies" ON companies;
DROP POLICY IF EXISTS "Admins can update companies" ON companies;
DROP POLICY IF EXISTS "Users can register companies" ON companies;
DROP POLICY IF EXISTS "Users can view their companies" ON companies;
DROP POLICY IF EXISTS "Owners can update their company" ON companies;

DROP POLICY IF EXISTS "Users can insert themselves as company users" ON company_users;
DROP POLICY IF EXISTS "Users can view their company relationships" ON company_users;
DROP POLICY IF EXISTS "Company owners can manage users" ON company_users;
DROP POLICY IF EXISTS "Users can add themselves to companies" ON company_users;
DROP POLICY IF EXISTS "Users can view their company memberships" ON company_users;
DROP POLICY IF EXISTS "Owners can view company users" ON company_users;
DROP POLICY IF EXISTS "Owners can manage company users" ON company_users;
DROP POLICY IF EXISTS "Admins can view all company users" ON company_users;

-- Companies table policies
-- Allow authenticated users to insert companies
CREATE POLICY "Users can register companies"
  ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to view companies they're associated with
CREATE POLICY "Users can view their companies"
  ON companies
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_users
      WHERE company_users.company_id = companies.id
      AND company_users.user_id = auth.uid()
    )
  );

-- Allow admins to view all companies
CREATE POLICY "Admins can view all companies"
  ON companies
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to update companies
CREATE POLICY "Admins can update companies"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow company owners to update their own company
CREATE POLICY "Owners can update their company"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_users
      WHERE company_users.company_id = companies.id
      AND company_users.user_id = auth.uid()
      AND company_users.role = 'OWNER'
    )
  );

-- Company users table policies
-- Allow users to insert themselves as company users
CREATE POLICY "Users can add themselves to companies"
  ON company_users
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow users to view their company relationships
CREATE POLICY "Users can view their company memberships"
  ON company_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow company owners to view all users in their company
CREATE POLICY "Owners can view company users"
  ON company_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_users cu
      WHERE cu.company_id = company_users.company_id
      AND cu.user_id = auth.uid()
      AND cu.role = 'OWNER'
    )
  );

-- Allow company owners to manage users in their company
CREATE POLICY "Owners can manage company users"
  ON company_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_users cu
      WHERE cu.company_id = company_users.company_id
      AND cu.user_id = auth.uid()
      AND cu.role = 'OWNER'
    )
  );

-- Allow admins to view all company users
CREATE POLICY "Admins can view all company users"
  ON company_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add RLS policies for company-related tables (only if they exist)
-- These policies will be added when the corresponding tables are created

-- Note: The following tables will be created in future migrations:
-- - company_saved_searches
-- - company_profile_views
-- - company_contacts
-- - company_activity_log
-- - company_credit_transactions
--
-- Their RLS policies will be added in those respective migration files.
