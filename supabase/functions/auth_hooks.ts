
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  const payload = await req.json();
  const { type, email, user_id, new_user } = payload;

  // Only process auth.signin events
  if (type !== 'auth.signin') {
    return new Response(JSON.stringify({ message: 'Not handling this event type' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  }

  console.log('Processing auth hook for sign in:', { email, user_id, new_user });

  try {
    // Get the user's metadata to check if they have a role
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user_id);
    
    if (userError) {
      console.error('Error fetching user data:', userError);
      throw userError;
    }
    
    const role = userData.user?.user_metadata?.role;
    
    if (role === 'coordinator') {
      console.log('User has coordinator role in metadata, adding to user_roles table');
      
      // Check if the user already has the role assigned
      const { data: existingRole, error: roleCheckError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user_id)
        .eq('role', 'coordinator')
        .single();
        
      if (roleCheckError && roleCheckError.code !== 'PGRST116') { // PGRST116 is "No rows returned" error
        console.error('Error checking for existing role:', roleCheckError);
      }
      
      // Only insert if the role doesn't exist
      if (!existingRole) {
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: user_id,
            role: 'coordinator'
          })
          .select()
          .single();
          
        if (roleError) {
          console.error('Error inserting user role:', roleError);
          throw roleError;
        }
        
        console.log('Added coordinator role to user:', user_id);
        console.log('Role data:', roleData);
      } else {
        console.log('User already has coordinator role assigned');
      }
    } else {
      console.log('User does not have coordinator role in metadata');
    }

    return new Response(JSON.stringify({ message: 'Auth hook processed successfully' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in auth hook:', error);
    
    // Still return 200 to avoid blocking the authentication process
    return new Response(JSON.stringify({ 
      message: 'Auth hook processed with errors', 
      error: error.message 
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});
