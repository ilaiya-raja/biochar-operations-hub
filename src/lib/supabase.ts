
import { createClient } from '@supabase/supabase-js';

// Use the actual Supabase URL and anon key from the project
const supabaseUrl = 'https://axwhpqvnsqpdqidameqa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4d2hwcXZuc3FwZHFpZGFtZXFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NjgzNDMsImV4cCI6MjA2MDA0NDM0M30.x_y7M698VxkfRDYDa0rL_NofVQcF1hUs9DPbnnIT31M';

// Create a Supabase client with explicit auth configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage
  }
});
