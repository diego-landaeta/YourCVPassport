-- Clean ALL existing company policies and recreate from scratch
-- Run this to completely reset RLS policies for companies

-- Drop ALL policies on companies table
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'companies' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON companies';
    END LOOP;
END $$;

-- Drop ALL policies on company_users table
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'company_users' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON company_users';
    END LOOP;
END $$;

-- Now create the correct policies

-- Companies table policies
CREATE POLICY "Users can register companies"
  ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

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

CREATE POLICY "Admins can view all companies"
  ON companies
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update companies"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all companies"
  ON companies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

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
CREATE POLICY "Users can add themselves to companies"
  ON company_users
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their company memberships"
  ON company_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

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

CREATE POLICY "Admins can view all company users"
  ON company_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all company users"
  ON company_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
