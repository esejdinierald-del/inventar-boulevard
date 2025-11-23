-- Create table for daily entry history
CREATE TABLE public.daily_entry_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_date DATE NOT NULL,
  turn_number INTEGER NOT NULL CHECK (turn_number IN (1, 2)),
  data JSONB NOT NULL,
  action_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_daily_entry_history_date ON public.daily_entry_history(entry_date DESC);
CREATE INDEX idx_daily_entry_history_created ON public.daily_entry_history(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.daily_entry_history ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone to view and insert (since there's no auth yet)
CREATE POLICY "Allow public read access" 
ON public.daily_entry_history 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access" 
ON public.daily_entry_history 
FOR INSERT 
WITH CHECK (true);

-- Function to automatically clean old history (keep last 100 entries per date)
CREATE OR REPLACE FUNCTION public.cleanup_old_history()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.daily_entry_history
  WHERE id IN (
    SELECT id FROM public.daily_entry_history
    WHERE entry_date = NEW.entry_date AND turn_number = NEW.turn_number
    ORDER BY created_at DESC
    OFFSET 100
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to cleanup old history after insert
CREATE TRIGGER trigger_cleanup_old_history
AFTER INSERT ON public.daily_entry_history
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_old_history();