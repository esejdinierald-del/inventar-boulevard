## Problemi
Pas printit, `gjendjeUploaded` rikthehet në `false`, por në `ProductTable.tsx` `blurClass` aplikohet vetëm te kolonat **Stok Fillim**, **Dif** dhe totalet. Kolonat **Gjendje**, **Shirit**, **Furnizime** nuk sfumohen, kështu që një staf që hyn me PIN tjetër në T2 mund t'i shohë vlerat e T1.

## Ndryshimet

**Skedari i vetëm:** `src/components/DailyEntry/ProductTable.tsx`

1. Aplikoj `blurClass` te `<TableCell>` për:
   - kolonën **Gjendje** (rresht ~171)
   - kolonën **Shirit** (rresht ~181)
   - kolonën **Furnizime** (rresht ~191)
   - kolonën e **emrit të produktit** (rresht ~140) — që edhe rreshti i plotë të duket i sfumuar uniformisht

2. Shtoj `tabIndex={-1}` te të gjitha Input-et brenda qelizave të sfumuara, që të mos jenë të fokusueshme me Tab kur `isBlurred` është true.

3. `pointer-events-none` te `blurClass` tashmë bllokon klikimet, kështu që staf-i s'mund të hapë/modifikojë vlerat e fshehura.

## Sjellja pas rregullimit
- **Para "Ngarko Gjendjen"**: i gjithë rreshti (stok, gjendje, shirit, furnizime, dif) sfumohet → staf-i sheh vetëm butonin "Ngarko Gjendjen".
- **Pas konfirmimit të Gjendjes**: rreshti zhsfumohet, staf-i punon normalisht.
- **Pas Print & Lock**: `gjendjeUploaded[turn] = false` → i gjithë rreshti i atij turni sfumohet përsëri. Edhe nëse hyn staf tjetër me PIN, nuk i sheh vlerat.
- **Admin**: gjithmonë i sheh (sepse `isBlurred = !isAdminUnlocked && !gjendjeUploaded`).

## Pa prekur
- Logjikën e ruajtjes, formulën Dif, propagimin e stokut, mapimet, furnizimet, fjalëkalimet ose RLS.
- `TurnSection.tsx`, `DailyEntry.tsx`, edge functions.
