## Sjellja e re

| Faza | Stok Fillim & Dif | Furnizime | Gjendje |
|------|------------------|-----------|---------|
| Para konfirmimit | Të fshehura (blur) | **Të dukshme & të editueshme** | Të editueshme |
| Pas "Ngarko Gjendjen" | Të dukshme, bllokuar për staf | **Të dukshme, të bllokuara për staf** | Të dukshme, të bllokuara për staf |
| Admin (gjithmonë) | Të editueshme | **Të editueshme** | Të editueshme |

## Ndryshimi

Në `src/components/DailyEntry/ProductTable.tsx`:

1. Hiq `blurClass` nga `<TableCell>` e kolonës **Furnizime** (rresht produkti).
2. Zgjero kushtin `disabled` të input-it të Furnizime me `(gjendjeUploaded && !isAdminUnlocked)`, me të njëjtën logjikë si kolona **Gjendje**.
3. Përditëso `tabIndex` nëse kolona është e bllokuar (në vend të `isBlurred` përdor kushtin e ri të bllokimit).

Totali i Furnizimeve në rreshtin TOTAL tashmë nuk ka `blurClass`, kështu që nuk kërkohet ndryshim atje. Kolonat **Stok Fillim**, **Shiriti** dhe **Dif** mbeten të pazhvendosura.