import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  const payload = await req.json();
  const { type, email, user_id, new_user } = payload;

  console.log('Auth hook called with event:', type, 'for user:', email);

  try {
    // Handle both sign-in and sign-up events to ensure role assignment
    if (type === 'auth.signin' || type === 'auth.signup') {
      console.log('Processing auth hook for:', { email, user_id, new_user });
      
      // Get the user's metadata to check for role
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user_id);
      
      if (userError) {
        console.error('Error fetching user data:', userError);
        throw userError;
      }
      
      // Check if user has a role in metadata
      const role = userData.user?.user_metadata?.role;
      
      if (role) {
        console.log(`User has ${role} role in metadata, adding to user_roles table`);
        
        // Ensure the user_roles table exists
        try {
          // Execute the function to create user_roles table if it doesn't exist
          const { error: createTableError } = await supabase.rpc('create_user_roles_if_not_exists');
          if (createTableError) {
            console.error('Error creating user_roles table:', createTableError);
          }
        } catch (tableError) {
          console.error('Exception creating user_roles table:', tableError);
        }
        
        // Check if the user role already exists to avoid duplicates
        const { data: existingRole, error: roleCheckError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', user_id)
          .eq('role', role)
          .single();
          
        if (roleCheckError && roleCheckError.code !== 'PGRST116') { // PGRST116 is "No rows returned" error
          console.log('No existing role found or error checking:', roleCheckError);
        }
        
        // Only insert if the role doesn't exist
        if (!existingRole) {
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: user_id,
              role: role
            })
            .select();
            
          if (roleError) {
            console.error('Error inserting user role:', roleError);
            throw roleError;
          }
          
          console.log(`Added ${role} role to user:`, user_id);
          console.log('Role data:', roleData);
        } else {
          console.log(`User already has ${role} role assigned`);
        }
      } else {
        console.log('User does not have a role in metadata');
      }

      // For testing, also check if the user is a coordinator by email
      if (email) {
        const { data: coordinator, error: coordError } = await supabase
          .from('coordinators')
          .select('*')
          .eq('email', email)
          .maybeSingle();
          
        if (coordError) {
          console.error('Error checking coordinator by email:', coordError);
        }
        
        if (coordinator) {
          console.log('Found matching coordinator in database by email:', coordinator);
          
          // Also add coordinator role if the user is a coordinator by email
          const { data: existingCoordRole, error: coordRoleCheckError } = await supabase
            .from('user_roles')
            .select('*')
            .eq('user_id', user_id)
            .eq('role', 'coordinator')
            .single();
            
          if (coordRoleCheckError && coordRoleCheckError.code !== 'PGRST116') {
            console.log('Error checking existing coordinator role:', coordRoleCheckError);
          }
          
          if (!existingCoordRole) {
            console.log('Adding coordinator role based on email match');
            const { data: coordRoleData, error: coordRoleError } = await supabase
              .from('user_roles')
              .insert({
                user_id: user_id,
                role: 'coordinator'
              })
              .select();
              
            if (coordRoleError) {
              console.error('Error inserting coordinator role:', coordRoleError);
            } else {
              console.log('Added coordinator role based on email match');
            }
          } else {
            console.log('User already has coordinator role assigned');
          }
        }
      }
    }

    return new Response(JSON.stringify({ message: 'Auth hook processed successfully' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in auth hook:', error);
    
    // Return 200 to avoid blocking authentication
    return new Response(JSON.stringify({ 
      message: 'Auth hook processed with errors', 
      error: error.message 
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});
