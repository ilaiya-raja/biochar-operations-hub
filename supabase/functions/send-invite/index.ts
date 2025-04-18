
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { Resend } from "npm:resend@2.0.0";

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

    // Generate magic link
    console.log('Generating magic link...');
    const { data: magicLinkData, error: magicLinkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        data: {
          name: name,
          role: 'coordinator'
        }
      }
    });

    if (magicLinkError) {
      console.error('Error generating magic link:', magicLinkError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to generate magic link: ${magicLinkError.message}` 
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }
    
    console.log('Magic link generated successfully');
    const magicLink = magicLinkData?.properties?.action_link;
    
    if (!magicLink) {
      console.error('Magic link was not generated');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Magic link was not generated' 
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    // Send invitation email with magic link
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
          <p>You have been invited to join Biochar Operations Hub as a coordinator. Click the magic link below to sign in instantly:</p>
          <p><a href="${magicLink}">Sign In to Biochar Operations Hub</a></p>
          <p>After signing in, you'll have access to:</p>
          <ul>
            <li>Manage biomass collections</li>
            <li>Monitor pyrolysis processes</li>
            <li>Track fertilizer distributions</li>
            <li>View analytics and reports</li>
          </ul>
          <p>This magic link will expire in 24 hours for security reasons.</p>
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
