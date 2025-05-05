-- Create fertilizer_distributions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.fertilizer_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES public.farmers(id),
  coordinator_id UUID NOT NULL REFERENCES public.coordinators(id),
  fertilizer_id UUID NOT NULL REFERENCES public.fertilizers(id),
  quantity DECIMAL NOT NULL,
  quantity_unit TEXT NOT NULL,
  name TEXT,
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.fertilizer_distributions ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow authenticated users to manage fertilizer distributions
CREATE POLICY "Allow authenticated users to manage fertilizer distributions" 
ON public.fertilizer_distributions FOR ALL TO authenticated USING (true);

-- Enable realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.fertilizer_distributions;