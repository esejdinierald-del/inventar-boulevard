
# Plan: ZIP i projektit për Claude

Claude.ai pranon ngarkim ZIP-i direkt në bisedë (deri ~30MB për plan-in falas, më shumë me Pro). Po të përgatis një arkiv të pastër, pa skedarë të panevojshëm.

## Çfarë do bëj

1. **Krijo ZIP** te `/mnt/documents/inventar-boulevard-source.zip` që përmban:
   - `src/` (gjithë kodi React/TS)
   - `supabase/` (edge functions + config)
   - `public/`
   - `index.html`, `package.json`, `tsconfig*.json`, `vite.config.ts`, `tailwind.config.ts`, `vitest.config.ts`, `components.json`, `eslint.config.js`, `postcss.config.js`
   - `README.md`
   - `.lovable/memory/` (kontekst i rregullave të biznesit — e dobishme për Claude)

2. **Përjashto** (që ZIP-i të jetë i vogël dhe pa zhurmë):
   - `node_modules/`, `dist/`, `.git/`, `.cache/`, `bun.lockb`, `package-lock.json`
   - `.env` (sekretet — KURRË në ZIP për Claude)
   - `src/integrations/supabase/types.ts` (auto-gjeneruar, i madh) — opsionale; mund të mbahet nëse Claude pyet për tipet

3. **Shto një `CONTEXT.md` në krye të ZIP-it** me:
   - Përshkrim të shkurtër të projektit (aplikacion menaxhimi inventari + xhiro për kafene/bar)
   - Stack: React 18 + Vite + TS + Tailwind + Lovable Cloud (Supabase)
   - Problemi aktual që po debug-ojmë (T2 stokFillim / furnizime / propagim)
   - Skedarët kyç ku Claude duhet të fokusohet: `src/services/calculations.ts`, `src/services/stock-propagation.service.ts`, `src/hooks/useTurnData.ts`, `src/pages/DailyEntry.tsx`

4. **Verifikim**: kontrolloj madhësinë; nëse > 25MB, heq edhe `.lovable/memory/` ose ndaj në dy ZIP.

5. **Dorëzimi**: lë `<presentation-artifact>` për ta shkarkuar direkt.

## Si ta përdorësh me Claude

1. Shkarko ZIP-in nga butoni që do shfaqet.
2. Hap [claude.ai](https://claude.ai) → bisedë e re (mundësisht me model Sonnet 4.5 ose Opus).
3. Tërhiq ZIP-in në bisedë + shkruaj pyetjen, p.sh.:
   > "Lexo `CONTEXT.md` së pari. Pastaj më jep mendim mbi logjikën e propagimit të stokut në `stock-propagation.service.ts` dhe `useTurnData.ts`. A ka race condition apo bug që mund të shkaktojnë T2.stokFillim të gabuar?"

## Pse jo opsione të tjera
- **GitHub**: ti the që s'e merr dot — kalojmë.
- **MCP / Claude Code**: kërkojnë lidhje me repo; ZIP është më i shpejtë për një konsultim një-herësh.

A ta krijoj ZIP-in tani?
