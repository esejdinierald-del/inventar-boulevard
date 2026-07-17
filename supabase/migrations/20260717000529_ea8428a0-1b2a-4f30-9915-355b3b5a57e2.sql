-- Additive: shto kolonën track_daily te 4 tabelat e produkteve që përdoren në DailyEntry.
-- DEFAULT true → asnjë ndryshim i dukshëm për të dhënat ekzistuese.
-- sort_order tashmë ekziston te të 4 tabelat, s'ka nevojë për shtim/backfill.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS track_daily boolean NOT NULL DEFAULT true;

ALTER TABLE public.coffee_types
  ADD COLUMN IF NOT EXISTS track_daily boolean NOT NULL DEFAULT true;

ALTER TABLE public.kitchen_products
  ADD COLUMN IF NOT EXISTS track_daily boolean NOT NULL DEFAULT true;

ALTER TABLE public.alcoholic_drinks_inventory
  ADD COLUMN IF NOT EXISTS track_daily boolean NOT NULL DEFAULT true;