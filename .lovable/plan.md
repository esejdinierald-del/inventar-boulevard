
# Plan: Zbatim i 6 Fix-eve nga Claude

Mori sygjerimet e Claude dhe i strukturova si plan zbatimi. Të 6 janë të sigurta, të vogla, dhe nuk prishin logjikën që ndërtuam.

## Ndryshimet

### 1. `src/services/stock-propagation.service.ts` — Lock kundër propagimit paralel
- Shto `private static isPropagating = false`
- Në `propagateFromDate` dhe `rebaseFromGjendje`: nëse `isPropagating === true` → return menjëherë
- Vendos `isPropagating = true` në fillim, `false` në `finally`
- **Pse**: Parandalon dy thirrje paralele që shkruajnë mbi njëra-tjetrën në Supabase

### 2. `src/hooks/useTurnData.ts` → `applyAlcoholicDrinksImmediately` — Math.max(0, ...) për shitje
- `newShitje = Math.max(0, (drink.shitje || 0) + delta)`
- **Pse**: Mbron nga shitje negative kur delta < 0 (re-upload me sasi më të vogël)

### 3. `src/services/alcoholic-drinks.service.ts` — Deprecate `applyAlcoholicDrinksSales`
- Shto JSDoc `@deprecated`
- `return;` menjëherë në krye të metodës me `console.error('DEPRECATED…')`
- **Pse**: Bllokon dyfishim nëse dikush e thërret aksidentalisht në të ardhmen

### 4. `src/hooks/useTurnData.ts` → `copyT1ToT2` — Fallback kur `gjendje = 0`
- `newStokFillim = t1Data.gjendje > 0 ? t1Data.gjendje : calculateStockForNextTurn(t1Data)`
- **Pse**: Nëse stafi kopjon T1→T2 para se të numërojë gjendjen, T2 nuk fillon me 0

### 5. `src/components/InvoiceMappingManager.tsx` — Konfirmim para fshirjes
- Wrap `deleteMapping(isAdmin)` me `window.confirm('⚠️ Je i sigurt? Kjo do të fshijë TË GJITHA mapinget')`
- **Pse**: Mbron nga klik aksidental që fshin gjithë historinë

### 6. `src/hooks/useTurnData.ts` — `Math.max(0, …)` te `updateTurn1Product` dhe `updateTurn2Product`
- Kur `field === 'furnizime'`: `next.stokFillim = Math.max(0, (existing.stokFillim || 0) + delta)`
- **Pse**: Parandalon stokFillim negativ kur stafi zvogëlon furnizimet

## Çfarë NUK preket
- Formula `calculateT2StokFillim` (mbetet siç është)
- Auto-sync useEffect debounces
- Tabela `alcohol_deductions` (Claude propozoi migration; verifikoj nëse ekziston përpara — mendoj se po, e krijuam në punën e mëparshme)

## Verifikim
- `bunx vitest run` — të 26 testet ekzistuese duhet të kalojnë
- Build pa errore

## Pyetje për ty para se të zbatoj
A i miraton të 6 ndryshimet, apo do të heqim ndonjë? Të gjitha janë defensive — nuk ndryshojnë logjikën, vetëm shtojnë mbrojtje.
