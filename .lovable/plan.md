## Qëllimi

Pasi stafi shtyp **"📥 Ngarko Gjendjen"**, kolona **Gjendje** për atë turn (T1 ose T2, për datën aktuale) bëhet **vetëm-lexim** për stafin. Vetëm admini mund ta **riaktivizojë** stafin që ta modifikojë sërish.

## Çfarë do ndryshojë

### 1) ProductTable.tsx
- Të pranojë props të ri `gjendjeLocked: boolean`.
- Inputet e kolonës **Gjendje** bëhen `disabled` kur `gjendjeLocked && !isAdminUnlocked`.
- Mbi tabelë, te banner-i ekzistues "Ngarko Gjendjen":
  - **Para konfirmimit** (gjendje e pa-konfirmuar): shfaqet siç është tani — buton "Ngarko Gjendjen".
  - **Pas konfirmimit** (gjendje e konfirmuar/kyçur): banner-i kthehet në një kart info të gjelbër me tekstin "✅ Gjendja u ngarkua dhe është kyçur".
    - Nëse `isAdminUnlocked`: shtohet buton **"🔓 Riaktivizo për stafin"** që thërret `onUnlockGjendje`.
    - Nëse jo admin: pa buton, vetëm tekst që informon stafin të kërkojë adminin.

### 2) TurnSection.tsx
- Përcillen props të reja `gjendjeLocked` dhe `onUnlockGjendje` te `ProductTable`.

### 3) DailyEntry.tsx
- Logjika: `gjendjeLocked` për një turn = `gjendjeUploaded[turn]` (sapo stafi konfirmon, kolona kyçet).
- Funksion i ri `unlockGjendje(turn)`:
  - Vetëm nëse `isAdminUnlocked` (përndryshe `toast.error`).
  - Vendos `gjendjeUploaded[turn] = false` në state dhe ruan në `localStorage` me të njëjtin çelës `gjendjeUploaded:<date>`.
  - Toast: "Stafi u riaktivizua të modifikojë Gjendjen e Turnit X".
- Pasohet `gjendjeLocked={gjendjeUploaded.turnX}` dhe `onUnlockGjendje={() => unlockGjendje('turnX')}` te të dy `<TurnSection>`-at.

## Çfarë NUK preket

- Logjika e sfumimit të Stok Fillim & Dif (siç është tani: zbulohet pas konfirmimit dhe mbetet e zbuluar deri sa admini ta zhbllokojë, e cila do të rifsehë automatikisht meqë `gjendjeUploaded` kthehet në false — kjo është e logjikshme: kur stafi rinis, edhe blur-i kthehet derisa të konfirmojë sërish).
- Formula e Dif, propagimi i stokut, shiriti, furnizimet, kafeja.
- DB-ja dhe RLS-të — vetëm frontend.

## Si do të testohet

1. Si staf: plotëso Gjendjen → "Ngarko Gjendjen" → kolona Gjendje bëhet `disabled` dhe shfaqet banner-i i gjelbër pa buton.
2. Provo të editosh një vlerë Gjendjeje → e bllokuar.
3. Si admin (kliko "Admin" me PIN/fjalëkalim) → te banner-i shfaqet "🔓 Riaktivizo për stafin" → kliko → Gjendja e stafit hapet sërish për edit dhe blur-i te Stok Fillim & Dif kthehet (deri në konfirmim të ri).
4. Reload faqes me të njëjtën datë → gjendja e kyçur ruhet (vjen nga localStorage).
