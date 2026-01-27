-- =====================================================
-- CREATE ADMIN FUNCTION TO DELETE USERS
-- =====================================================

-- This function allows admins to delete users from the auth.users table
-- which will cascade delete all related profile data

-- Drop function if it exists
DROP FUNCTION IF EXISTS public.delete_user_by_id(uuid);

-- Create the function with security definer to allow admins to delete users
CREATE OR REPLACE FUNCTION public.delete_user_by_id(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the current user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can delete users';
  END IF;

  -- Delete from auth.users (this will cascade to profiles and all related tables)
  DELETE FROM auth.users WHERE id = user_id;

  -- If the user doesn't exist in auth.users, also try to delete from profiles
  -- in case there's orphaned data
  DELETE FROM profiles WHERE id = user_id;
END;
$$;

-- Grant execute permission to authenticated users (the function itself checks for admin role)
GRANT EXECUTE ON FUNCTION public.delete_user_by_id(uuid) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.delete_user_by_id(uuid) IS
'Admin-only function to delete a user and all their related data. Requires admin role.';
