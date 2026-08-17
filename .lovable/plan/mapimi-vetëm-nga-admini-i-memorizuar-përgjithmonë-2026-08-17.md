# Mapimi vetëm nga admini, i memorizuar përgjithmonë

## Çfarë ndryshon

1. **Mapimi që bën admini ruhet vërtet në databazë** dhe vlen automatikisht për çdo datë dhe për të dy turnet (T1/T2) nga sot e tutje — mapimi është global, jo i lidhur me datë.
2. **Stafi nuk zgjedh më mapim as sasi** te skaneri i shiritit. Stafi ngarkon foton, sheh listën e artikujve dhe rezultatin e mapimit vetëm si lexim (read-only), pastaj shtyp "Apliko". Artikujt pa mapim injorohen si më parë.
3. **Admini (i loguar me Admin te /daily)** e ka të njëjtin panel mapimi te skaneri, mund ta ndryshojë, dhe çdo ndryshim ruhet menjëherë në databazë → vlen për të gjitha skanimet e ardhshme.

## Pse mapimi "harrohej" sot

- Politikat e sigurisë lejojnë vetëm INSERT për përdorues të loguar; UPDATE dhe DELETE kërkojnë rol real `admin`. Sesioni i aplikacionit është anonim, ndaj ruajtja dështonte.
- Ruajtja bëhej me "fshi gjithçka + rifut" — kur fshirja dështonte, mbeteshin të vjetrat ose dublikata.
- Në dështim, kodi shkruante heshturazi te localStorage dhe shfaqte "u ruajt me sukses", ndaj mapimi zhdukej në pajisje tjetër.
- Skaneri i shiritit nuk e ruante fare mapimin — jetonte vetëm sa ishte hapur dialogu.

## Detajet teknike

**Databaza**
- Politika të reja mbi `product_mappings`: UPDATE dhe DELETE të lejuara për `authenticated` (portat e adminit mbeten në UI, si te pjesa tjetër e aplikacionit). Politikat ekzistuese admin mbeten.

**`src/services/storage.service.ts`**
- `setProductMapping`: zëvendëso `delete + insert` me `upsert` mbi `receipt_name` (kolona është UNIQUE), plus fshirje selektive vetëm e çelësave që janë hequr.
- Shto `saveProductMappingEntry(receiptName, {type, name, quantity})` për ruajtje të një rreshti të vetëm nga skaneri.
- Hiq fallback-un e heshtur: gabimi kthehet lart (throw) që UI të shfaqë toast të kuq; localStorage mbetet vetëm si cache leximi.

**`src/components/ReceiptScanner.tsx`**
- Prop i ri `isAdminUnlocked`.
- Kur `false` (staf): heq `select`-in dhe input-in e sasisë, heq checkbox-in e filtrit; shfaq vetëm rreshtin e artikullit dhe etiketën "✓ Produkt: X ×N" ose "⚪ Injorohet". Butoni "Apliko të Dhënat" mbetet.
- Kur `true` (admin): panel-i aktual i mapimit mbetet; çdo ndryshim te `select` ose sasia ruhet menjëherë në databazë me çelës emrin real të artikullit të shiritit (`receiptItems[index].name`), me toast suksesi/gabimi.
- Ndryshimi i titullit: "Hapi 2: Mapimi (vetëm admin)".

**`src/components/DailyEntry/TurnSection.tsx` dhe `src/pages/DailyEntry.tsx`**
- Kalo `isAdminUnlocked` te `ReceiptScanner` (ekziston tashmë si prop te TurnSection).

## Jashtë fushës
- Mapimi i faturave (`invoice_mappings`) nuk preket në këtë hap.
- Nuk ndryshohet asnjë formulë stoku, dif-i apo furnizimesh.
