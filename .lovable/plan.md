## Problemi

Backend-i funksionon (testuar drejtpërdrejt: PIN `1111` kthen Andrea, PIN `2222` kthen Elvi), por dialogu i stafit në klient shfaq "PIN i gabuar ose jo aktiv". Diçka në mes po e bllokon ose po e interpreton gabim përgjigjen.

## Diagnoza me logje

Do shtoj logje të hollësishme në `src/components/DailyEntry/StaffPinVerifyDialog.tsx` brenda `handleVerifyStaff` për të kapur:

- Pin-i i dërguar (gjatësia, vlera e maskuar)
- `error` i plotë nga Supabase RPC (kodi, mesazhi, hint, details)
- `data` e plotë e kthyer (array, length, elementi i parë)
- Sesionin aktual të Supabase (a ka user_id anon, a është JWT-ja valide)

Kështu kur ti provon prap 1111, do shohim në console arsyen reale (p.sh. JWT i pavlefshëm → 401, ose response bosh sepse përgjigjet nuk po deserialohen).

## Çfarë do ndryshoj

Vetëm një skedar:

- `src/components/DailyEntry/StaffPinVerifyDialog.tsx` — shtoj `console.log` para/pas thirrjes RPC dhe te dega ku `verifiedStaff` është `undefined`. Pa ndryshime logjike — vetëm diagnostikë.

## Hapi tjetër (pas planit)

1. Aprovo planin → implementoj logjet.
2. Ti provon përsëri 1111 në preview.
3. Më dërgo console-logs (ose unë i lexoj direkt) → identifikoj shkakun.
4. Bëj fix-in përfundimtar (mund të jetë rifreskim sesioni anon, retry, ose diçka tjetër).

Nuk dua të bëj fix "me sy mbyllur" sepse mund të prek logjikën e autentikimit pa nevojë.