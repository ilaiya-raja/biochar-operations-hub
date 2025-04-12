
import { createClient } from '@supabase/supabase-js';

// Since this is a demo project, we'll provide fallback values
// In a production environment, you would use environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

// Create a Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Check if Supabase URL is properly configured
if (supabaseUrl === 'https://your-supabase-url.supabase.co') {
  console.warn('⚠️ Default Supabase URL is being used. Please set the VITE_SUPABASE_URL environment variable.');
}

// Check if Supabase anon key is properly configured
if (supabaseAnonKey === 'your-supabase-anon-key') {
  console.warn('⚠️ Default Supabase anon key is being used. Please set the VITE_SUPABASE_ANON_KEY environment variable.');
}
