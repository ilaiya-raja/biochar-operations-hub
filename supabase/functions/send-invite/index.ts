
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
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Email service configuration is missing' 
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

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
    
    // Add user to user_roles table with coordinator role
    if (authUser.user) {
      console.log('Setting coordinator role for user...');
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([{ user_id: authUser.user.id, role: 'coordinator' }]);
        
      if (roleError) {
        console.error('Error setting user role:', roleError);
        // Continue execution, we'll try to send the invitation regardless
        console.log('Will continue without role assignment for now');
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
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to generate password reset link: ${resetError.message}` 
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
      console.error('Reset link was not generated');
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
    
    let emailResult;
    try {
      emailResult = await resend.emails.send({
        from: 'Biochar Operations <onboarding@resend.dev>',
        to: [email],
        subject: 'Welcome to Biochar Operations Hub - Coordinator Access',
        html: `
          <h1>Welcome to Biochar Operations Hub</h1>
          <p>Hello ${name},</p>
          <p>You have been invited to join Biochar Operations Hub as a coordinator. To get started, please set up your password by clicking the link below:</p>
          <p><a href="${resetLink}">Set Up Your Password</a></p>
          <p>After setting your password, you'll have access to:</p>
          <ul>
            <li>Manage biomass collections</li>
            <li>Monitor pyrolysis processes</li>
            <li>Track fertilizer distributions</li>
            <li>View analytics and reports</li>
          </ul>
          <p>This link will expire in 24 hours for security reasons.</p>
          <p>Best regards,<br>Biochar Operations Team</p>
        `,
      });
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to send email: ${emailError.message || 'Unknown email error'}` 
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }
    
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
