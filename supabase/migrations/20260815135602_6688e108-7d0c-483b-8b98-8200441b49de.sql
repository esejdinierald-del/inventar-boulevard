DO $$
DECLARE
  r record; prev_t2 jsonb := NULL; t1 jsonb; t2 jsonb;
  prods1 jsonb; prods2 jsonb; k text; v jsonb; newstok numeric;
BEGIN
  FOR r IN SELECT id, entry_date, turn1_data, turn2_data FROM public.daily_entries ORDER BY entry_date LOOP
    t1 := r.turn1_data; t2 := r.turn2_data;
    prods1 := COALESCE(t1->'products','{}'::jsonb);
    prods2 := COALESCE(t2->'products','{}'::jsonb);

    IF prev_t2 IS NOT NULL THEN
      FOR k, v IN SELECT * FROM jsonb_each(prods1) LOOP
        IF prev_t2 ? k THEN
          newstok := COALESCE((prev_t2->k->>'stokFillim')::numeric,0) - COALESCE((prev_t2->k->>'shiriti')::numeric,0);
          prods1 := jsonb_set(prods1, ARRAY[k,'stokFillim'], to_jsonb(newstok));
        END IF;
      END LOOP;
    END IF;

    FOR k, v IN SELECT * FROM jsonb_each(prods2) LOOP
      IF prods1 ? k THEN
        newstok := COALESCE((prods1->k->>'stokFillim')::numeric,0) - COALESCE((prods1->k->>'shiriti')::numeric,0);
        prods2 := jsonb_set(prods2, ARRAY[k,'stokFillim'], to_jsonb(newstok));
      END IF;
    END LOOP;

    UPDATE public.daily_entries
      SET turn1_data = jsonb_set(t1,'{products}',prods1),
          turn2_data = jsonb_set(t2,'{products}',prods2)
      WHERE id = r.id;

    prev_t2 := prods2;
  END LOOP;
END $$;