
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('Received request to send-invite function');
  
  try {
    // Parse request body and validate required fields
    let reqBody;
    try {
      reqBody = await req.json();
    } catch (e) {
      console.error('Error parsing request JSON:', e);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid request format' 
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    const { email, name } = reqBody;
    
    if (!email || !name) {
      console.error('Missing required fields:', { email, name });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: email and name are required' 
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }
    
    console.log(`Processing invitation for: ${email}, name: ${name}`);

    try {
      // Check if the user already exists
      const { data: existingUser, error: userLookupError } = await supabase.auth.admin.listUsers({
        filter: {
          email: email
        }
      });
      
      if (userLookupError) {
        console.error('Error checking for existing user:', userLookupError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Error checking for existing user: ${userLookupError.message}` 
          }), 
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        );
      }
      
      // If user already exists, just update their metadata with the coordinator role
      if (existingUser && existingUser.users && existingUser.users.length > 0) {
        const existingUserId = existingUser.users[0].id;
        console.log('User already exists with ID:', existingUserId);
        
        // Update the user's metadata to include role
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          existingUserId,
          { user_metadata: { name, role: 'coordinator' } }
        );
        
        if (updateError) {
          console.error('Error updating existing user metadata:', updateError);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `Failed to update user metadata: ${updateError.message}` 
            }), 
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500 
            }
          );
        }
        
        console.log('Updated existing user metadata with coordinator role');
        
        // Manually add role to user_roles table if it doesn't exist
        try {
          // Execute the function to create user_roles table if it doesn't exist
          const { error: createTableError } = await supabase.rpc('create_user_roles_if_not_exists');
          if (createTableError) {
            console.error('Error creating user_roles table:', createTableError);
          }
          
          // Check if role already exists for this user
          const { data: existingRole, error: roleCheckError } = await supabase
            .from('user_roles')
            .select('*')
            .eq('user_id', existingUserId)
            .eq('role', 'coordinator')
            .maybeSingle();
            
          if (roleCheckError && roleCheckError.code !== 'PGRST116') {
            console.error('Error checking existing role:', roleCheckError);
          }
          
          // Add coordinator role if it doesn't exist
          if (!existingRole) {
            const { error: insertRoleError } = await supabase
              .from('user_roles')
              .insert({
                user_id: existingUserId,
                role: 'coordinator'
              });
              
            if (insertRoleError) {
              console.error('Error inserting coordinator role:', insertRoleError);
            } else {
              console.log('Added coordinator role to user_roles table');
            }
          } else {
            console.log('User already has coordinator role in user_roles table');
          }
        } catch (roleError) {
          console.error('Error managing user roles:', roleError);
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'User already exists, metadata updated with coordinator role' 
          }), 
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }
      
      // User doesn't exist, send an invitation with a direct URL
      console.log('User does not exist. Sending invitation email...');
      
      // Format the redirect URL to match what Supabase expects
      const redirectUrl = `${supabaseUrl.replace('.co', '.co/auth/callback')}`;
      
      // Use sendEmailInvite which is specifically designed for sending invites
      const { data: inviteData, error: inviteError } = await supabase.auth.admin.generateLink({
        type: 'invite',
        email: email,
        options: {
          data: {
            name: name,
            role: 'coordinator'
          },
          redirectTo: redirectUrl
        }
      });
      
      if (inviteError) {
        console.error('Error generating invite link:', inviteError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Failed to generate invitation link: ${inviteError.message}` 
          }), 
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        );
      }
      
      // Now actually send the invite email
      const { error: emailError } = await supabase.auth.admin.sendEmailInvite({
        email: email,
        options: {
          // Use the generated URL from the previous step
          redirectTo: inviteData?.properties?.action_link || redirectUrl
        }
      });
      
      if (emailError) {
        console.error('Error sending invitation email:', emailError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Failed to send invitation email: ${emailError.message}` 
          }), 
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        );
      }
      
      console.log('Invitation sent successfully:', inviteData);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Invitation sent successfully' 
        }), 
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (inviteError) {
      console.error('Error in invitation process:', inviteError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Invitation error: ${inviteError.message}` 
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }
  } catch (error) {
    console.error('Error in send-invite function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'An unknown error occurred'
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
