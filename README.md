# Inventar Boulevard — Sistemi i Menaxhimit të Inventarit

Aplikacion web për menaxhimin ditor të inventarit, stokut, kafes, pijeve alkoolike dhe shpenzimeve për bare/restorante. I ndërtuar me React + TypeScript + Lovable Cloud.

## 📋 Përmbledhje

- **Regjistrimi ditor** me dy turne (T1 & T2) — stoku, shiriti, furnizime, gjendje
- **Skanimi i shiritave** me AI (OCR) për ngarkimin automatik të shitjeve
- **Skanimi i faturave** për ngarkimin automatik të furnizimeve
- **Llogaritje automatike** të diferencave, mullirit, xhiros
- **Propagim stoku** automatik ditë pas dite
- **Raporte** ditore, javore, mujore
- **Pijet alkoolike** — inventar i veçantë me furnizime/shitje/gjendje
- **Shpenzime** — regjistrimi dhe raportimi i shpenzimeve fikse
- **Kyçja e turneve** — për sigurinë pas printimit
- **PIN stafi** — akses me PIN për çdo staf/menaxher

## 🛠 Teknologjitë

| Teknologji | Roli |
|---|---|
| React 18 | Ndërfaqja e përdoruesit |
| TypeScript | Siguria e tipeve |
| Vite | Build + dev server |
| Tailwind CSS | Stilizimi |
| shadcn/ui | Komponentë UI |
| React Query | Menaxhimi i gjendjes server |
| Lovable Cloud | Backend (databazë, auth, edge functions) |
| React Router | Navigimi |

## 📁 Struktura e Projektit

```
src/
├── components/
│   ├── DailyEntry/          # Komponentë për regjistrimin ditor
│   │   ├── ProductTable     # Tabela e produkteve (stok, shiriti, gjendje)
│   │   ├── CoffeeTable      # Tabela e kafes
│   │   ├── TurnExtras       # Xhiro, mulliri, diferenca
│   │   ├── TurnSection      # Seksioni i plotë i një turni
│   │   ├── ShpenzimiTable   # Shpenzimet e turnit
│   │   └── PrintableTurnReport  # Raporti për printim
│   ├── Dashboard/           # Paneli admin (menaxhim produktesh, stafi)
│   ├── InvoiceMapping/      # Mapimi i faturave → produkte
│   ├── ui/                  # shadcn/ui komponentë bazë
│   └── Layout.tsx           # Layout kryesor me navigim
├── hooks/
│   ├── useTurnData.ts       # Hook kryesor: ngarkimi, ruajtja, sinkronizimi T1↔T2
│   ├── useAlcoholicDrinks.ts # Menaxhimi i pijeve alkoolike
│   ├── useInvoiceMappings.ts # Skanimi dhe mapimi i faturave
│   ├── useTurnLock.ts       # Kyçja/shkyçja e turneve
│   └── useAuth.ts           # Autentifikimi
├── services/
│   ├── calculations.ts      # Llogaritjet matematikore (dif, stok, mulliri)
│   ├── storage.service.ts   # CRUD me Supabase (stok, daily entries, mappings)
│   ├── stock-propagation.service.ts  # Propagimi i stokut në datat pasardhëse
│   └── alcoholic-drinks.service.ts   # Inventari i pijeve alkoolike
├── types/
│   ├── turn.types.ts        # Tipet: ProductData, TurnData, DailyEntryData
│   └── mapping.types.ts     # Tipet: ProductMapping, ReceiptItem
├── pages/                   # Faqet e aplikacionit
├── utils/                   # Funksione ndihmëse
└── integrations/supabase/   # Klienti dhe tipet e Supabase (auto-gjeneruar)

supabase/
└── functions/               # Edge functions (AI analysis, stock recalculation)
```

## 🔑 Koncepte Kryesore

### Turnet (T1 & T2)
Çdo ditë ka dy turne. Për secilin produkt regjistrohet:
- **Stok Fillim** — stoku fillestar (nga dita/turni i mëparshëm)
- **Furnizime** — sasitë e furnizuara gjatë turnit
- **Shiriti** — sasitë e regjistruara në kasë (nga skaneri)
- **Gjendje** — numërimi fizik në fund të turnit

### Formula e Diferencës
```
Dif = Shiriti + Gjendje - StokFillim - Furnizime
```
- **Negative** = mungesa (produkte të pashitura)
- **Pozitive** = tepricë

### Propagimi i Stokut
- T1.stokFillim ← nga `next_day_stock` (dita e mëparshme T2)
- T2.stokFillim ← T1.gjendje (nëse > 0) ose llogaritje teorike
- Mulliri sinkronizohet: T2.mulliriFillim ← T1.mulliriPerfund

### Mulliri (Grinder)
```
Dif Mulliri = Total Kafe - (Mulliri Perfund - Mulliri Fillim)
```

## 🚀 Instalimi Lokal

```bash
# Klono repository-n
git clone <YOUR_GIT_URL>
cd inventar-boulevard

# Instalo varësitë
npm install

# Fillo serverin e zhvillimit
npm run dev
```

## 🧪 Testimi

```bash
# Ekzekuto testet e njësisë
npx vitest run

# Ekzekuto me watch mode
npx vitest
```

Testet ndodhen në skedarë `*.test.ts` pranë moduleve përkatëse.

## 📊 Tabelat e Databazës

| Tabela | Përshkrimi |
|---|---|
| `daily_entries` | Të dhënat ditore (T1 & T2 si JSON) |
| `products` | Lista e produkteve |
| `coffee_types` | Llojet e kafes |
| `alcoholic_drinks_inventory` | Inventari i pijeve alkoolike |
| `next_day_stock` | Stoku për ditën tjetër |
| `product_mappings` | Mapimi shiriti → produkt |
| `invoice_mappings` | Mapimi faturë → produkt |
| `expenses` | Shpenzimet |
| `expense_templates` | Shablonet e shpenzimeve fikse |
| `staff_turn_pins` | PIN-et e stafit |

## 🔒 Siguria

- Autentifikim anonim automatik
- PIN i stafit për akses në regjistrimin ditor
- Fjalëkalimi admin për panelin e menaxhimit
- Kyçja e turneve pas printimit (vetëm admin mund ta shkyçë)
- RLS (Row Level Security) në të gjitha tabelat

## 📱 PWA

Aplikacioni mbështet instalimin si PWA (Progressive Web App) në pajisje mobile.
