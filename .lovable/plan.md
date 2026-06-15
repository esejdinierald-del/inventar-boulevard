## Qëllimi
Vendos butonin **📦 Ngarko Furnizime** brenda kartës së verdhë "Numëro fizikisht gjendjen" për të dy turnet (T1 dhe T2), që stafi ta ketë qartë si hap përpara konfirmimit. Butoni ekzistues në header mbetet (akses global).

## Ndryshime

### 1. `src/components/DailyEntry/ProductTable.tsx`
- Shto prop opsionale `invoiceUploadSlot?: ReactNode`.
- Brenda banner-it `!gjendjeUploaded` (rasti i stafit para konfirmimit), shfaq slot-in mbi rreshtin me "Ngarko Gjendjen".
- Përditëso tekstin udhëzues si listë hapash:
  1. Ngarko furnizimet (faturat) — nëse ka.
  2. Numëro fizikisht gjendjen e secilit produkt.
  3. Shtyp "Ngarko Gjendjen" për të zbuluar Stok Fillim & Dif.

### 2. `src/components/DailyEntry/TurnSection.tsx`
- Shto prop opsionale `invoiceUploadSlot?: ReactNode`.
- Kalo atë drejt te `<ProductTable>`.

### 3. `src/pages/DailyEntry.tsx`
- Importo dhe rendero një `<InvoiceMappingManager>` si `invoiceUploadSlot` për secilin `<TurnSection>` (T1 dhe T2), me të njëjtat props si instance e header (`products`, `kitchenProducts`, `alcoholicDrinks`, `isAdmin`, `onApplySupplies`).

## Pa ndryshime
- Logjika e furnizimeve, stokut, Dif: e paprekur.
- Butoni në header nuk hiqet.
- Sjellja e `Ngarko Gjendjen` (kërkesa për gjendje > 0) e njëjtë.
