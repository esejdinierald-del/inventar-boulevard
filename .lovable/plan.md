## Qëllimi
Të krijoj një ZIP të ri me skedarët më të rëndësishëm për rishikim nga Claude, të fokusuar te: **skaneri i kafesë (mulliri), shiriti (receipt), mapimi (produkte + fatura), dhe siguria** (auth, RLS, role, PIN-e). Përfshin edhe ndryshimet e fundit (stock-propagation me lock per-datë).

## Çfarë do të përfshijë ZIP-i

### 1. Skaneri i kafesë (Mulliri)
- `src/components/GrinderPhotoScanner.tsx`
- `supabase/functions/analyze-grinder/index.ts`
- `src/components/DailyEntry/CoffeeTable.tsx`

### 2. Shiriti (Receipt scanner)
- `src/components/ReceiptScanner.tsx`
- `supabase/functions/analyze-receipt/index.ts`

### 3. Mapimi (Produkte + Fatura)
- `src/components/ProductMappingManager.tsx`
- `src/components/InvoiceMappingManager.tsx`
- `src/components/InvoiceMapping/InvoiceUploadStep.tsx`
- `src/components/InvoiceMapping/InvoiceMappingStep.tsx`
- `src/hooks/useInvoiceMappings.ts`
- `src/utils/invoiceMatching.ts`
- `src/types/mapping.types.ts`
- `src/components/Dashboard/ProductMappingsTable.tsx`
- `src/components/Dashboard/InvoiceMappingsTable.tsx`
- `supabase/functions/analyze-invoice/index.ts`

### 4. Siguria (Auth, RLS, Role, PIN)
- `src/hooks/useAuth.ts`
- `src/hooks/useAnonymousAuth.ts`
- `src/hooks/useStaffSession.ts`
- `src/hooks/useManagerPermissions.ts`
- `src/hooks/useGeofence.ts`
- `src/hooks/useTurnLock.ts`
- `src/components/DailyEntry/StaffPinVerifyDialog.tsx`
- `src/components/DailyEntry/AdminPasswordDialog.tsx`
- `src/components/DailyEntry/GeofenceGuard.tsx`
- `src/components/DailyEntry/StaffOnboardingDialog.tsx`
- `src/lib/geofence.ts`
- `src/lib/validation.ts`
- `src/components/Dashboard/StaffTurnPinsManager.tsx`

### 5. Logjika kritike (ndryshimet e fundit)
- `src/services/stock-propagation.service.ts` (per-date lock i ri)
- `src/services/calculations.ts`
- `src/services/alcoholic-drinks.service.ts`
- `src/hooks/useTurnData.ts`
- `src/types/turn.types.ts`

### 6. Kontekst
- `CONTEXT.md` i përditësuar me përmbledhjen e ndryshimeve të fundit (per-date lock 60s) dhe fokusin e këtij ZIP-i.

## Si do të paketohet
- Skript bash që kopjon vetëm listën e mësipërme në `/tmp/inventar-review/`
- Krijon `CONTEXT.md` brenda asaj direktorie
- ZIP → `/mnt/documents/inventar-boulevard-review.zip`
- Përgjigjet me `<presentation-artifact>` për shkarkim

## Pyetje
A dëshiron të përfshij edhe testet (`calculations.test.ts`, `geofence.test.ts`) që Claude të shohë mbulimin e testeve për logjikën kritike?
