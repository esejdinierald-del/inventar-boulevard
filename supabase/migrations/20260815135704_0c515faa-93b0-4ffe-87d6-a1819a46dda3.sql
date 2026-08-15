DO $$
DECLARE
  r record; prev_t2 jsonb := NULL; t1 jsonb; t2 jsonb;
  prods1 jsonb; prods2 jsonb; k text; v jsonb; base numeric; nd jsonb;
BEGIN
  FOR r IN SELECT id, entry_date, turn1_data, turn2_data FROM public.daily_entries ORDER BY entry_date LOOP
    t1 := r.turn1_data; t2 := r.turn2_data;
    prods1 := COALESCE(t1->'products','{}'::jsonb);
    prods2 := COALESCE(t2->'products','{}'::jsonb);

    IF prev_t2 IS NOT NULL THEN
      FOR k, v IN SELECT * FROM jsonb_each(prods1) LOOP
        IF prev_t2 ? k THEN
          base := CASE
            WHEN COALESCE((prev_t2->k->>'gjendje')::numeric,0) > 0
              THEN COALESCE((prev_t2->k->>'gjendje')::numeric,0)
            ELSE GREATEST(COALESCE((prev_t2->k->>'stokFillim')::numeric,0) - COALESCE((prev_t2->k->>'shiriti')::numeric,0), 0)
          END;
          prods1 := jsonb_set(prods1, ARRAY[k,'stokFillim'],
            to_jsonb(base + COALESCE((v->>'furnizime')::numeric,0)));
        END IF;
      END LOOP;
    END IF;

    FOR k, v IN SELECT * FROM jsonb_each(prods2) LOOP
      IF prods1 ? k THEN
        base := CASE
          WHEN COALESCE((prods1->k->>'gjendje')::numeric,0) > 0
            THEN COALESCE((prods1->k->>'gjendje')::numeric,0)
          ELSE GREATEST(COALESCE((prods1->k->>'stokFillim')::numeric,0) - COALESCE((prods1->k->>'shiriti')::numeric,0), 0)
        END;
        prods2 := jsonb_set(prods2, ARRAY[k,'stokFillim'],
          to_jsonb(base + COALESCE((v->>'furnizime')::numeric,0)));
      END IF;
    END LOOP;

    UPDATE public.daily_entries
      SET turn1_data = jsonb_set(t1,'{products}',prods1),
          turn2_data = jsonb_set(t2,'{products}',prods2)
      WHERE id = r.id;

    -- next_day_stock për ditën pasardhëse: gjendja fizike e T2 (ose teorike)
    SELECT jsonb_object_agg(key,
      CASE WHEN COALESCE((val->>'gjendje')::numeric,0) > 0
        THEN COALESCE((val->>'gjendje')::numeric,0)
        ELSE GREATEST(COALESCE((val->>'stokFillim')::numeric,0) - COALESCE((val->>'shiriti')::numeric,0), 0)
      END)
    INTO nd FROM jsonb_each(prods2) AS e(key,val);

    IF nd IS NOT NULL THEN
      INSERT INTO public.next_day_stock (stock_date, stock_data)
      VALUES ((r.entry_date + 1), nd)
      ON CONFLICT (stock_date) DO UPDATE SET stock_data = EXCLUDED.stock_data;
    END IF;

    prev_t2 := prods2;
  END LOOP;
END $$;