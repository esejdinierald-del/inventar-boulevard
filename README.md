# Inventar Boulevard — Sistemi i Menaxhimit të Inventarit

Aplikacion web (PWA) për menaxhimin ditor të inventarit, stokut, kafes, pijeve alkoolike dhe shpenzimeve për bare/restorante. I ndërtuar me **React 18 + TypeScript + Vite + Tailwind + shadcn/ui** dhe **Lovable Cloud** (Supabase) si backend.

---

## 📋 Përmbledhje Funksionale

- **Regjistrim ditor** me dy turne (T1 & T2): stoku, shiriti, furnizime, gjendje
- **Skanim shiritash (OCR/AI)** për ngarkimin automatik të shitjeve
- **Skanim faturash** për ngarkimin automatik të furnizimeve
- **Skanim mulliri (grinder)** për vlerën "Mulliri Përfund" via foto
- **Llogaritje automatike** të diferencave, mullirit, xhiros, kostove
- **Propagim stoku** automatik ditë pas dite (T1 → T2 → T1 e ditës tjetër)
- **Raporte** ditore/javore/mujore + eksport CSV
- **Pije alkoolike** — inventar global me furnizime/shitje/gjendje (idempotent)
- **Shpenzime** — turn expenses + shabllone fikse (rent, rrogë)
- **Kyçje turnesh** pas printimit (vetëm admin i shkyç)
- **PIN 4-shifror** për staf/menaxherë; **fjalëkalim** për admin
- **Geofencing** për restriksione hyrjeje sipas lokacionit
- **PWA** — instalohet në mobile

---

## 🛠 Stack-u Teknik

| Teknologji | Roli |
|---|---|
| React 18 + TypeScript 5 | UI + siguri tipesh |
| Vite 5 | Build + dev server |
| Tailwind CSS v3 | Stilizimi (tokena semantikë në `src/index.css`) |
| shadcn/ui + Radix | Komponentë UI |
| React Query | Server state |
| React Router | Navigimi |
| Lovable Cloud (Supabase) | DB, Auth, RLS, Edge Functions |
| Lovable AI Gateway | Modele AI për OCR (fatura, shiriti, mulliri) |
| Vitest | Testet e njësisë |

---

## 📁 Struktura e Projektit

```
inventar-boulevard/
├── public/                          # Asetet statike (PWA icons, robots.txt)
├── src/
│   ├── components/
│   │   ├── DailyEntry/              # Regjistrimi ditor (T1 & T2)
│   │   │   ├── ProductTable.tsx     # Tabela e produkteve
│   │   │   ├── CoffeeTable.tsx      # Tabela e kafes
│   │   │   ├── AlcoholicDrinksTable.tsx
│   │   │   ├── ShpenzimiTable.tsx   # Shpenzimet e turnit
│   │   │   ├── TurnExtras.tsx       # Xhiro, mulliri, diferenca
│   │   │   ├── TurnSection.tsx      # Seksioni i një turni
│   │   │   ├── StaffPinVerifyDialog.tsx
│   │   │   ├── AdminPasswordDialog.tsx
│   │   │   ├── GeofenceGuard.tsx    # Kufizim gjeografik
│   │   │   └── PrintableTurnReport.tsx
│   │   ├── Dashboard/               # Paneli admin
│   │   │   ├── ProductsManager.tsx
│   │   │   ├── CoffeeTypesManager.tsx
│   │   │   ├── AlcoholicDrinksManager.tsx
│   │   │   ├── KitchenProductsManager.tsx
│   │   │   ├── StaffTurnPinsManager.tsx
│   │   │   ├── FixedExpensesManager.tsx
│   │   │   ├── ExpensesReport.tsx
│   │   │   ├── ProductMappingsTable.tsx
│   │   │   └── InvoiceMappingsTable.tsx
│   │   ├── InvoiceMapping/          # Wizard për fatura
│   │   ├── ReceiptScanner.tsx
│   │   ├── GrinderPhotoScanner.tsx
│   │   ├── InvoiceMappingManager.tsx
│   │   ├── ProductMappingManager.tsx
│   │   ├── Layout.tsx
│   │   └── ui/                      # shadcn primitives
│   ├── hooks/
│   │   ├── useTurnData.ts           # Hook kryesor: load/save/sync T1↔T2
│   │   ├── useAlcoholicDrinks.ts
│   │   ├── useAlcoholicDrinksList.ts
│   │   ├── useInvoiceMappings.ts
│   │   ├── useTurnLock.ts
│   │   ├── useAuth.ts               # Admin session
│   │   ├── useStaffSession.ts       # PIN session 60min
│   │   ├── useManagerPermissions.ts
│   │   ├── useProductList.ts
│   │   ├── useKitchenProducts.ts
│   │   ├── useDifStartDates.ts
│   │   ├── useGeofence.ts
│   │   └── useAnonymousAuth.ts
│   ├── services/
│   │   ├── calculations.ts          # Formulat matematikore
│   │   ├── storage.service.ts       # CRUD Supabase
│   │   ├── stock-propagation.service.ts
│   │   └── alcoholic-drinks.service.ts
│   ├── pages/
│   │   ├── Index.tsx
│   │   ├── DailyEntry.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Reports.tsx
│   │   ├── Expenses.tsx
│   │   ├── Install.tsx              # Udhëzime PWA
│   │   ├── Manual.tsx / ManualStaff.tsx / ManualAdmin.tsx
│   │   └── NotFound.tsx
│   ├── types/                       # ProductData, TurnData, DailyEntryData…
│   ├── lib/                         # utils, geofence, validation
│   ├── utils/invoiceMatching.ts
│   ├── integrations/supabase/       # client + types (AUTO-GEN)
│   ├── test/setup.ts
│   ├── index.css                    # Tokena të dizajnit (HSL semantik)
│   ├── App.tsx
│   └── main.tsx
├── supabase/
│   ├── config.toml                  # verify_jwt për edge functions
│   ├── functions/
│   │   ├── analyze-receipt/         # OCR shiriti
│   │   ├── analyze-invoice/         # OCR faturash
│   │   ├── analyze-grinder/         # OCR mulliri
│   │   ├── fix-t2-stock/            # Riparim historik T2
│   │   └── recalculate-all-stock/   # Rillogaritje globale
│   └── migrations/                  # SQL migrations të versionuara
├── .lovable/
│   ├── memory/                      # Rregullat persistente të projektit
│   └── plan.md
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig*.json
├── vitest.config.ts
└── README.md
```

---

## 🔑 Konceptet Kryesore

### Turnet
Çdo ditë ka **T1** dhe **T2**. Për secilin produkt regjistrohet:
- `stokFillim` — stoku fillestar
- `furnizime` — sasitë e furnizuara
- `shiriti` — shitjet nga kasa
- `gjendje` — numërimi fizik në fund

### Formula e Diferencës
```
Dif = shiriti + gjendje − stokFillim − furnizime
```
- **Negative** → mungesa (produkte të pashitura)
- **Pozitive** → tepricë

### Propagim Stoku
- `T1.stokFillim` ← `next_day_stock` (T2 e ditës së kaluar)
- `T2.stokFillim = (T1.stokFillim − T1.shiriti) + T2.furnizime` — ruan furnizimet e T2
- `T2.mulliriFillim` ← `T1.mulliriPerfund`

### Mulliri (Grinder)
```
Dif Mulliri = Total Kafe − (mulliriPerfund − mulliriFillim)
```

### Pije Alkoolike (idempotent)
Deduktimi bëhet nga tabela `alcohol_deductions` me `UNIQUE(entry_date, turn_number, drink_name)` — re-upload nuk dyfishon.

---

## 🚀 Ekzekutimi Lokal

### Kërkesat
- Node.js ≥ 18
- npm / bun / pnpm
- (Opsionale) Supabase CLI për migrime lokale

### Instalimi
```bash
git clone <YOUR_GIT_URL>
cd inventar-boulevard
npm install
```

### Variabla mjedisi
Skedari `.env` në root duhet të përmbajë (auto-gjenerohet nga lidhja Lovable Cloud):
```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>
VITE_SUPABASE_PROJECT_ID=<project-id>
```
> Këto vlera janë publike — RLS mbron të dhënat. **Mos i fshi para publikimit** ose faqja del bosh.

### Dev server
```bash
npm run dev          # http://localhost:8080
```

### Build produksioni
```bash
npm run build
npm run preview
```

### Testet
```bash
npx vitest run       # një herë
npx vitest           # watch mode
```

---

## 🗄 Databaza & Migrimet

### Tabelat kryesore
| Tabela | Përshkrimi |
|---|---|
| `daily_entries` | Të dhënat ditore (T1 & T2 si JSONB) |
| `daily_entry_history` | Histori ndryshimesh (rreshtat e fundit 100) |
| `shift_turns` | Turnet e reja fleksibël (JSONB) |
| `products` | Lista e produkteve |
| `coffee_types` | Llojet e kafes |
| `kitchen_products` | Produkte kuzhine (jashtë propagimit) |
| `alcoholic_drinks_inventory` | Inventari global i pijeve |
| `alcohol_deductions` | Deduktime idempotente pije |
| `next_day_stock` | Stoku për ditën tjetër |
| `product_mappings` | Shiriti → produkt (me sasi fraksionale) |
| `invoice_mappings` | Faturë → produkt |
| `expenses` | Shpenzime |
| `expense_templates` | Shabllone shpenzimesh fikse |
| `staff_turn_pins` | PIN-e stafi (verify_staff_pin RPC) |
| `user_roles` | Rolet (app_role: admin, manager, staff) |

### Funksione DB
- `verify_staff_pin(_pin)` — validon PIN dhe kthen staff_name, is_manager, permissions
- `has_role(_user_id, _role)` — kontroll roli (SECURITY DEFINER)
- `handle_updated_at()` — trigger për timestamp
- `cleanup_old_history()` — mban vetëm 100 rreshta për (date, turn)

### Ekzekutimi i migrimeve
Migrimet ekzekutohen **automatikisht** nga Lovable Cloud kur ndryshojnë. Për krijim të ri:

1. Gjenero një migrim të ri në `supabase/migrations/<timestamp>_<emri>.sql`
2. Sekuenca e detyrueshme për tabela të reja në schemën `public`:
   ```sql
   CREATE TABLE public.<name> (...);
   GRANT SELECT, INSERT, UPDATE, DELETE ON public.<name> TO authenticated;
   GRANT ALL ON public.<name> TO service_role;
   ALTER TABLE public.<name> ENABLE ROW LEVEL SECURITY;
   CREATE POLICY ... ;
   ```
3. Shto trigger `handle_updated_at` nëse tabela ka `updated_at`.
4. Migrimi aplikohet automatikisht pas miratimit; tipet te `src/integrations/supabase/types.ts` rigjenerohen automatikisht.

> **Kurrë** mos redakto manualisht `src/integrations/supabase/{client,types}.ts` ose `.env` — janë auto-gen.

---

## ⚡ Edge Functions

Funksionet janë në `supabase/functions/<name>/index.ts` (Deno) dhe deklarohen te `supabase/config.toml`:

```toml
[functions.analyze-receipt]  verify_jwt = false
[functions.analyze-grinder]  verify_jwt = false
[functions.analyze-invoice]  verify_jwt = false
```

| Funksioni | Qëllimi |
|---|---|
| `analyze-receipt` | OCR mbi foto shiriti → items + total |
| `analyze-invoice` | OCR mbi faturë → items + çmime |
| `analyze-grinder` | OCR mbi ekranin e mullirit |
| `fix-t2-stock` | Rikalkulon `T2.stokFillim` për të gjitha datat |
| `recalculate-all-stock` | Ripropagim i plotë i stokut |

### Deploy dhe testim
Funksionet **deploy-ohen automatikisht** kur ndryshon kodi. Për thirrje nga klienti:

```ts
const { data, error } = await supabase.functions.invoke("analyze-receipt", {
  body: { image: base64 },
});
```

Për debug lokal shiko log-et nga Lovable Cloud (View Backend → Functions → Logs).

### Sekretet e disponueshme (server-side)
- `LOVABLE_API_KEY` — për AI Gateway (modele Google/OpenAI pa çelës të vetin)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` — auto
- `SUPABASE_DB_URL`, `SUPABASE_JWKS`, `SUPABASE_PUBLISHABLE_KEY(S)`, `SUPABASE_SECRET_KEYS`

---

## 🔒 Siguria

- **Auth anonime** për staf + RLS në të gjitha tabelat
- **Admin** hyn me email/fjalëkalim + `has_role('admin')`
- **PIN 4-shifror** për staf/menaxherë (`verify_staff_pin` RPC, SECURITY DEFINER)
- **Sesion PIN 60 minuta** (fiks nga login, jo idle) — admini pa skadim
- **Kyçje turnesh** pas printimit (shkyçet vetëm nga admini)
- **Geofence** — hyrje vetëm nga lokacionet e lejuara
- **Rate limiting PIN admin** — max 3 tentativa
- **Rolet në tabelë të veçantë** (`user_roles`) — kurrë në `profiles`

---

## 🧪 Zhvillimi & Kontributi

- Kodi ndjek konvencionet e Lovable (React 18 + TS + Tailwind + shadcn)
- **Kurrë** mos hardcode ngjyra si `bg-white` / `text-black` — përdor tokena semantikë nga `src/index.css`
- Shto **JSDoc** për funksione publike të kompleksë
- Shkruaj **Vitest** për logjikë financiare (`calculations.test.ts`, `geofence.test.ts`)
- **Mos ndrysho** logjikën bërthamë të stokut/diferencës pa miratim shprehimor

---

## 📱 PWA

Aplikacioni instalohet në celular (iOS/Android). Instruksione në `/install`.

---

## 📄 Licenca

Pronësi e klientit — përdorim i brendshëm.
