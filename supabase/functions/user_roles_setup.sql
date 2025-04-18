
-- This SQL file contains the function to create user_roles table if it doesn't exist

-- Function to create user_roles table if it doesn't exist
CREATE OR REPLACE FUNCTION public.create_user_roles_if_not_exists()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the user_roles table exists
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'user_roles'
  ) THEN
    -- Create the user_roles table
    CREATE TABLE public.user_roles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      role text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(user_id, role)
    );

    -- Add RLS policies to the table
    ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
    
    -- Create policy to allow users to see their own roles
    CREATE POLICY "Users can view their own roles"
    ON public.user_roles
    FOR SELECT
    USING (auth.uid() = user_id);
    
    -- Create policy to allow authenticated users to insert roles
    CREATE POLICY "Authenticated users can insert roles"
    ON public.user_roles
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
    
    -- Create policy to allow users to update their own roles
    CREATE POLICY "Users can update their own roles"
    ON public.user_roles
    FOR UPDATE
    USING (auth.uid() = user_id);
    
    -- Create policy to allow users to delete their own roles
    CREATE POLICY "Users can delete their own roles"
    ON public.user_roles
    FOR DELETE
    USING (auth.uid() = user_id);
    
    RAISE NOTICE 'Created user_roles table with RLS policies';
  ELSE
    RAISE NOTICE 'user_roles table already exists';
  END IF;
END;
$$;
