# ImmoRechner — Real Estate Calculator

A bilingual (DE/EN) real estate investment calculator. Evaluate properties, compare financing options, track interest rate offers, and compute investment KPIs — all in one place.

## Features

### New Property
- Enter purchase price, area (m²), and ancillary costs (Grunderwerbsteuer, Maklerprovision, Notarkosten, Grundbucheintrag)
- Automatically calculates price per m², total Nebenkosten, and Gesamtkosten
- Record rental income (Kaltmiete, Warmmiete, Hausgeld) with derived Betriebskosten and Eigentümeranteil
- Save a listing URL (Inserat-Link) with one-click open; address opens in Google Maps

### Financing
- Input equity to calculate loan amount, monthly repayment, and full amortization schedule
- Export the amortization table as a PDF

### Interest Offers (Zinsangebote)
- Record multiple bank offers per property with: Sollzins, Effektiver Jahreszins, Darlehenssumme, Monatliche Rate, Gesamtbetrag, Zinsbindung, and Eigenkapital (Betrag)
- Compare offers side-by-side with an interactive bar chart (monthly rate vs. total interest)
- Saved offer cards display only the fields that were filled in

### Saved Properties
- Browse, edit, and delete saved properties
- Property name and address font scales with text length to keep card rows aligned across the grid
- Address row shows a 📍 Google Maps icon; long addresses truncate with ellipsis and show full text on hover
- View KPIs per property:
  - **Bruttomietrendite** — annual rent ÷ purchase price
  - **Eigenkapitalrendite** — annual cashflow ÷ equity input
- Compare up to N properties in a side-by-side table

### App-wide
- **Bilingual** — full DE/EN translation; switch language in Settings
- **Dark / Light theme** — toggle in Settings; changes apply only on Save
- **Currency & space unit** — configurable in Settings (e.g. €/$, m²/ft²)
- **Profile management** — set name and avatar initial
- **Toast notifications** for all save/update/delete actions
- **Animated counters** for computed totals
- **Skeleton loading** while data is fetched
- **Input validation** on both client and server with user-friendly error messages
- **Security hardening** — Helmet headers, rate limiting, parameterised SQL

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Backend | Node.js 24, Express 5, tsx |
| Database | SQLite (via `sqlite3`) |
| Charts | Recharts |
| PDF Export | jsPDF + jspdf-autotable |
| Security | Helmet, express-rate-limit |
| Testing | Vitest + React Testing Library |
| Containerisation | Docker + docker-compose |

## Getting Started

### Prerequisites

- Node.js 24+ (see [`.nvmrc`](.nvmrc))
- npm 10+

### Development

```bash
# 1. Install dependencies
npm install

# 2. Copy environment config
cp .env.example .env

# 3. Start both backend and frontend
npm run dev:full
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Health check: http://localhost:3001/health

The Vite dev server proxies all `/api/*` requests to the backend automatically — no manual URL configuration needed.

### Production (Docker)

```bash
# Build and start
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

The app will be available at http://localhost:3001.

SQLite data is persisted in a named Docker volume (`db_data`) and survives container restarts.

### Production (manual)

```bash
# 1. Build the frontend
npm run build

# 2. Start the server (serves both API and static files)
NODE_ENV=production npm run server
```

## Project Structure

```
├── src/
│   ├── api/                        # Typed fetch client + per-resource helpers
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   └── sections/
│   │       ├── NeueImmobilie.tsx       # New property form
│   │       ├── Finanzierung.tsx        # Financing calculator
│   │       ├── GespeicherteImmobilien.tsx  # Saved properties + KPIs
│   │       ├── Zinsangebote.tsx        # Interest offer comparison
│   │       ├── Settings.tsx            # App settings
│   │       └── Profile.tsx             # Profile management
│   ├── config/
│   │   ├── defaults.ts         # Default Nebenkosten percentages
│   │   └── translations.ts     # DE/EN strings
│   ├── context/
│   │   ├── LanguageContext.tsx
│   │   ├── ThemeContext.tsx
│   │   ├── SettingsContext.tsx
│   │   ├── ToastContext.tsx
│   │   └── ProfileContext.tsx
│   ├── hooks/
│   │   └── useAnimatedNumber.ts
│   ├── test/                    # Vitest unit + integration tests
│   ├── providers.tsx            # Composed AppProviders wrapper
│   └── types.ts                 # Shared TypeScript interfaces
├── server.js                    # Express API + static file server
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

## Environment Variables

Copy `.env.example` to `.env` and adjust as needed.

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Port the Express server listens on |
| `NODE_ENV` | `development` | Set to `production` to enable static file serving |
| `DB_PATH` | `./properties.db` | Path to the SQLite database file |
| `VITE_API_URL` | _(empty)_ | Override API base URL for the frontend (leave empty in dev) |

## API Reference

### Properties

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/properties` | List all properties |
| GET | `/api/properties/:id` | Get a single property |
| POST | `/api/properties` | Create a property |
| PUT | `/api/properties/:id` | Update a property |
| DELETE | `/api/properties/:id` | Delete a property |

### Interest Offers

| Method | Path | Description |
|---|---|---|
| GET | `/api/zinsangebote?property_id=` | List offers for a property |
| GET | `/api/zinsangebote/:id` | Get a single offer |
| POST | `/api/zinsangebote` | Create an offer |
| PUT | `/api/zinsangebote/:id` | Update an offer |
| DELETE | `/api/zinsangebote/:id` | Delete an offer |

**Offer fields:** `zinssatz`, `effektiver_jahreszins`, `eigenkapital_amount`, `zinsbindung`, `darlehenssumme`, `monatliche_rate`, `gesamtbetrag`

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server only |
| `npm run server` | Start Express API server only (via tsx) |
| `npm run dev:full` | Start both concurrently (recommended for development) |
| `npm run build` | Build the frontend for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run Vitest test suite |
| `npm run test:watch` | Run Vitest in watch mode |
