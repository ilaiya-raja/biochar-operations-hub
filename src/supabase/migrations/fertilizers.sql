
-- Create fertilizers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.fertilizers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  batch_number TEXT,
  produced_date DATE,
  quantity DECIMAL NOT NULL,
  quantity_unit TEXT NOT NULL,
  status TEXT DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.fertilizers ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow authenticated users to manage fertilizers
CREATE POLICY "Allow authenticated users to manage fertilizers" 
ON public.fertilizers FOR ALL TO authenticated USING (true);
