## Sjellja e re

Pas verifikimit të suksesshëm të PIN-it të stafit (jo admin), përpara se faqja `/daily` të bëhet plotësisht e dukshme/e përdorshme, shfaq një **dialog modal** me udhëzimet:

> 📋 Hapat para konfirmimit
> 1. Ngarko furnizimet (faturat) — nëse ka.
> 2. Numëro fizikisht gjendjen e secilit produkt.
> 3. Shtyp **Ngarko Gjendjen** për të zbuluar **Stok Fillim** dhe **Dif**.

Me një buton të vetëm: **"OK, kuptova"**. Pas klikimit dialog mbyllet dhe stafi vazhdon normalisht në `/daily`.

Nuk shfaqet për admin-in dhe nuk shfaqet kur stafi është verifikuar tashmë (vetëm një herë për sesion verifikimi).

## Ndryshimet teknike

1. **Komponent i ri** `src/components/DailyEntry/StaffOnboardingDialog.tsx`:
   - Props: `open: boolean`, `onAcknowledge: () => void`.
   - `Dialog` jo i mbyllshëm me ESC/click jashtë (njësoj si `StaffPinVerifyDialog`).
   - Përmban të njëjtin tekst si banner-i ekzistues në `ProductTable.tsx` dhe një buton `OK, kuptova`.

2. **`src/pages/DailyEntry.tsx`**:
   - Shto state `const [showStaffOnboarding, setShowStaffOnboarding] = useState(false)`.
   - Te `handlePinVerified`, nëse `!staffData?.isManager` (staf normal, jo admin/manager), vendos `setShowStaffOnboarding(true)`.
   - Render `<StaffOnboardingDialog open={showStaffOnboarding} onAcknowledge={() => setShowStaffOnboarding(false)} />` pranë `StaffPinVerifyDialog`.

Banner-i ekzistues te `ProductTable.tsx` mbetet i pandryshuar (vazhdon të shërbejë si referencë vizuale brenda tabelës).
