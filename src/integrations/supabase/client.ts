// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://axwhpqvnsqpdqidameqa.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4d2hwcXZuc3FwZHFpZGFtZXFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NjgzNDMsImV4cCI6MjA2MDA0NDM0M30.x_y7M698VxkfRDYDa0rL_NofVQcF1hUs9DPbnnIT31M";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);