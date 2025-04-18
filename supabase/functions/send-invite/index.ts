
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { Resend } from 'npm:resend@2.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
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
    // Verify we have a valid API key for Resend
    if (!Deno.env.get('RESEND_API_KEY')) {
      console.error('Missing RESEND_API_KEY environment variable');
      throw new Error('Email service configuration is missing');
    }

    const { email, name } = await req.json();
    console.log(`Processing invitation for: ${email}, name: ${name}`);
    
    // Create auth user with random password
    const tempPassword = Math.random().toString(36).slice(-8);
    console.log('Creating user in auth system...');
    const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    });

    if (createError) {
      console.error('Error creating user:', createError);
      throw createError;
    }
    
    console.log('User created successfully:', authUser.user.id);
    
    // Add user to user_roles table with coordinator role
    if (authUser.user) {
      console.log('Setting coordinator role for user...');
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([{ user_id: authUser.user.id, role: 'coordinator' }]);
        
      if (roleError) {
        console.error('Error setting user role:', roleError);
        // If the table doesn't exist, we'll create it
        if (roleError.code === '42P01') { // PostgreSQL error code for 'relation does not exist'
          console.log('user_roles table does not exist, attempting to create it');
          
          // Create user_roles table if it doesn't exist
          const { error: createTableError } = await supabase.rpc('create_user_roles_if_not_exists');
          
          if (createTableError) {
            console.error('Failed to create user_roles table:', createTableError);
          } else {
            console.log('Created user_roles table successfully');
            
            // Try inserting the role again
            const { error: retryRoleError } = await supabase
              .from('user_roles')
              .insert([{ user_id: authUser.user.id, role: 'coordinator' }]);
              
            if (retryRoleError) {
              console.error('Error setting user role after table creation:', retryRoleError);
            } else {
              console.log('Coordinator role set successfully after table creation');
            }
          }
        } else {
          console.log('Will continue without role assignment for now');
        }
      } else {
        console.log('Coordinator role set successfully');
      }
    }

    // Generate password reset link
    console.log('Generating password reset link...');
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
    });

    if (resetError) {
      console.error('Error generating reset link:', resetError);
      throw resetError;
    }
    
    console.log('Reset link generated successfully');
    const resetLink = resetData?.properties?.action_link;
    
    if (!resetLink) {
      throw new Error('Reset link was not generated');
    }

    // Send invitation email with reset link
    console.log('Sending invitation email via Resend...');
    console.log('Email To:', email);
    console.log('Reset Link:', resetLink);
    
    const emailResult = await resend.emails.send({
      from: 'Biochar Operations <onboarding@resend.dev>',
      to: [email],
      subject: 'Welcome to Biochar Operations Hub',
      html: `
        <h1>Welcome to Biochar Operations Hub</h1>
        <p>Hello ${name},</p>
        <p>You have been invited as a coordinator. Please click the link below to set up your password:</p>
        <p><a href="${resetLink}">Set Up Your Password</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>Best regards,<br>Biochar Operations Team</p>
      `,
    });
    
    console.log('Email send response:', emailResult);
    
    if (emailResult.error) {
      console.error('Resend API error:', emailResult.error);
      throw new Error(`Failed to send email: ${emailResult.error.message}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Invitation sent successfully',
      emailId: emailResult.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in send-invite function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'An unknown error occurred'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
