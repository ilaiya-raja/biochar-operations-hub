
-- This SQL file contains the function to create user_roles table if it doesn't exist
-- and add necessary triggers for handling user signups

-- Function to create user_roles table if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the user has a 'role' in their metadata
  IF new.raw_user_meta_data->>'role' IS NOT NULL THEN
    -- Insert the role into the user_roles table
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, new.raw_user_meta_data->>'role')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN new;
END;
$$;

-- Create trigger on auth.users to automatically add roles based on metadata
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_auth_user();

-- Also create a trigger for when user metadata is updated
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.raw_user_meta_data->>'role' IS DISTINCT FROM NEW.raw_user_meta_data->>'role')
  EXECUTE PROCEDURE public.handle_new_auth_user();
