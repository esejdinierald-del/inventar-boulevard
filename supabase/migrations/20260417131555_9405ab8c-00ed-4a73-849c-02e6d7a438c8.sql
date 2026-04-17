-- Rregullimi i stokut historik për "Paulaner e Turbullt"
-- Vendos stokFillim që përputhet me gjendjen fizike për të zeruar Dif
-- Zinxhiri: 04/07 T1 gj=23 → 04/14 T2 gj=23 → 04/15 (23→10) → 04/16 (gj=22)

-- 04/07 T1: stokFillim=23 (gjendja=23)
UPDATE daily_entries SET turn1_data = jsonb_set(
  turn1_data, '{products,Paulaner e Turbullt,stokFillim}', '23'::jsonb
) WHERE entry_date = '2026-04-07';

-- 04/07 T2: stokFillim=23 (mbajmë vlerën, T2 gj=0 mund të ishte fund-turn pa numërim)
UPDATE daily_entries SET turn2_data = jsonb_set(
  turn2_data, '{products,Paulaner e Turbullt,stokFillim}', '23'::jsonb
) WHERE entry_date = '2026-04-07';

-- 04/14 T1: stokFillim=23 (vazhdimësi)
UPDATE daily_entries SET turn1_data = jsonb_set(
  turn1_data, '{products,Paulaner e Turbullt,stokFillim}', '23'::jsonb
) WHERE entry_date = '2026-04-14';

-- 04/14 T2: stokFillim=23 (gjendje=23)
UPDATE daily_entries SET turn2_data = jsonb_set(
  turn2_data, '{products,Paulaner e Turbullt,stokFillim}', '23'::jsonb
) WHERE entry_date = '2026-04-14';

-- 04/15 T1: stokFillim=23 (gjendje=23)
UPDATE daily_entries SET turn1_data = jsonb_set(
  turn1_data, '{products,Paulaner e Turbullt,stokFillim}', '23'::jsonb
) WHERE entry_date = '2026-04-15';

-- 04/15 T2: stokFillim=23, gjendje=10 → shitje=13 (Dif=0)
UPDATE daily_entries SET turn2_data = jsonb_set(
  jsonb_set(turn2_data, '{products,Paulaner e Turbullt,stokFillim}', '23'::jsonb),
  '{products,Paulaner e Turbullt,shiriti}', '13'::jsonb
) WHERE entry_date = '2026-04-15';

-- 04/16 T1: stokFillim=10 (mbartur nga T2 prev: 23-13=10), gjendje=22 → ka furnizim 12
UPDATE daily_entries SET turn1_data = jsonb_set(
  jsonb_set(turn1_data, '{products,Paulaner e Turbullt,stokFillim}', '10'::jsonb),
  '{products,Paulaner e Turbullt,furnizime}', '12'::jsonb
) WHERE entry_date = '2026-04-16';

-- 04/16 T2: stokFillim=22 (10+12-0), gjendje=23 → futet edhe 1 furnizim
UPDATE daily_entries SET turn2_data = jsonb_set(
  jsonb_set(turn2_data, '{products,Paulaner e Turbullt,stokFillim}', '22'::jsonb),
  '{products,Paulaner e Turbullt,furnizime}', '1'::jsonb
) WHERE entry_date = '2026-04-16';

-- 04/17 T1: stokFillim=23 (mbartur nga 04/16 T2: 22+1-0=23), gjendje=22 → shitje=1
UPDATE daily_entries SET turn1_data = jsonb_set(
  jsonb_set(turn1_data, '{products,Paulaner e Turbullt,stokFillim}', '23'::jsonb),
  '{products,Paulaner e Turbullt,shiriti}', '1'::jsonb
) WHERE entry_date = '2026-04-17';

-- 04/17 T2: stokFillim=22 (23-1=22)
UPDATE daily_entries SET turn2_data = jsonb_set(
  turn2_data, '{products,Paulaner e Turbullt,stokFillim}', '22'::jsonb
) WHERE entry_date = '2026-04-17';