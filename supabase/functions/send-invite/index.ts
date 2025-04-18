
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

    // Create entry in user_roles table when the user first signs in
    // This is done via a trigger function that should be added to the database
    
    // Add a trigger that will create a user_role entry when the user signs in for the first time
    // The trigger will run the function defined in user_roles_setup.sql
    
    // Force the email to be sent (in case the automatic send isn't working)
    console.log('Sending magic link email directly...');
    const { error: sendEmailError } = await supabase.auth.admin.sendEmailInvite({
      email: email,
      data: {
        name: name,
        role: 'coordinator'
      }
    });
    
    if (sendEmailError) {
      console.error('Error sending email invite:', sendEmailError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to send email invite: ${sendEmailError.message}` 
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
        message: 'Invitation sent successfully via Supabase magic link'
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
