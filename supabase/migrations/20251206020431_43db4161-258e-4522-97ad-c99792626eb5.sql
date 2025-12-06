-- Add columns to track if turns are locked after printing
ALTER TABLE public.daily_entries 
ADD COLUMN IF NOT EXISTS turn1_locked boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS turn2_locked boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS turn1_locked_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS turn2_locked_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS turn1_locked_by text,
ADD COLUMN IF NOT EXISTS turn2_locked_by text;