
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

  try {
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

    // Send invitation email with reset link
    console.log('Sending invitation email...');
    const emailResult = await resend.emails.send({
      from: 'Biochar Operations <onboarding@resend.dev>',
      to: [email],
      subject: 'Welcome to Biochar Operations Hub',
      html: `
        <h1>Welcome to Biochar Operations Hub</h1>
        <p>Hello ${name},</p>
        <p>You have been invited as a coordinator. Please click the link below to set up your password:</p>
        <p><a href="${resetData.properties?.action_link}">Set Up Your Password</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>Best regards,<br>Biochar Operations Team</p>
      `,
    });
    
    console.log('Email send response:', emailResult);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in send-invite function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
