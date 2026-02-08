
-- Create table for waiter calls
CREATE TABLE public.waiter_calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_number INTEGER NOT NULL,
  call_type TEXT NOT NULL CHECK (call_type IN ('call_waiter', 'bill', 'menu', 'other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'completed')),
  special_request TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  priority INTEGER DEFAULT 1
);

-- Enable RLS
ALTER TABLE public.waiter_calls ENABLE ROW LEVEL SECURITY;

-- Policies for waiter calls - anyone can create/view/update
CREATE POLICY "Anyone can view waiter_calls" 
  ON public.waiter_calls 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can create waiter_calls" 
  ON public.waiter_calls 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update waiter_calls" 
  ON public.waiter_calls 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Authenticated users can delete waiter_calls" 
  ON public.waiter_calls 
  FOR DELETE 
  USING (true);

-- Create index for faster queries
CREATE INDEX idx_waiter_calls_status ON public.waiter_calls(status);
CREATE INDEX idx_waiter_calls_table ON public.waiter_calls(table_number);
CREATE INDEX idx_waiter_calls_created_at ON public.waiter_calls(created_at DESC);

-- Enable realtime for waiter_calls
ALTER PUBLICATION supabase_realtime ADD TABLE public.waiter_calls;
