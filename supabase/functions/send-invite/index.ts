
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
    
    if (!email || !name) {
      console.error('Missing required fields: email and name are required');
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
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to create user: ${createError.message}` 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }
    
    console.log('User created successfully:', authUser.user.id);
    
    // Create user_roles table if it doesn't exist and set coordinator role
    if (authUser.user) {
      // First try to create the table if it doesn't exist
      try {
        console.log('Ensuring user_roles table exists...');
        const { error: createTableError } = await supabase.rpc('create_user_roles_if_not_exists');
        
        if (createTableError) {
          console.error('Error creating user_roles table:', createTableError);
        } else {
          console.log('User roles table check completed');
        }
      } catch (error) {
        console.error('Exception during user_roles table check:', error);
      }
      
      // Now try to insert the role
      try {
        console.log('Setting coordinator role for user...');
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert([{ user_id: authUser.user.id, role: 'coordinator' }]);
          
        if (roleError) {
          console.error('Error setting user role:', roleError);
        } else {
          console.log('Coordinator role set successfully');
        }
      } catch (error) {
        console.error('Exception during role assignment:', error);
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
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to generate reset link: ${resetError.message}` 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }
    
    console.log('Reset link generated successfully');
    const resetLink = resetData?.properties?.action_link;
    
    if (!resetLink) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Reset link was not generated' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    // Send invitation email with reset link
    console.log('Sending invitation email via Resend...');
    console.log('Email To:', email);
    console.log('Reset Link:', resetLink);
    
    try {
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
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Failed to send email: ${emailResult.error.message}` 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Invitation sent successfully',
          emailId: emailResult.id
        }), 
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (emailError) {
      console.error('Exception sending email:', emailError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Email sending failed: ${emailError.message}` 
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
