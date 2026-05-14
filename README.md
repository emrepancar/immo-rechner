# ImmoRechner — Real Estate Calculator

A bilingual (DE/EN) real estate investment calculator. Evaluate properties, compare financing options, track interest rate offers, and compute investment KPIs — all in one place.

## Features

- **New Property** — Enter purchase price, ancillary costs (Nebenkosten), and rental income
- **Financing** — Input your equity to calculate loan amount, monthly repayment plan, and amortization schedule (PDF export)
- **Interest Offers** — Compare multiple bank offers side-by-side with an interactive bar chart
- **Saved Properties** — Browse, edit, and delete saved properties; view KPIs per property
  - **Bruttomietrendite** (Gross Rental Yield) — annual rent ÷ purchase price
  - **Eigenkapitalrendite** (Return on Equity) — annual cashflow ÷ equity input

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS 4 |
| Backend | Node.js 24, Express 5 |
| Database | SQLite (via `sqlite3`) |
| Charts | Recharts |
| PDF Export | jsPDF + jspdf-autotable |
| Containerization | Docker + docker-compose |

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
NODE_ENV=production node server.js
```

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx
│   │   └── sections/
│   │       ├── NeueImmobilie.jsx      # New property form
│   │       ├── Finanzierung.jsx       # Financing calculator
│   │       ├── GespeicherteImmobilien.jsx  # Saved properties + KPIs
│   │       └── Zinsangebote.jsx       # Interest offer comparison
│   ├── config/
│   │   ├── api.js          # Central API base URL
│   │   ├── defaults.js     # Default Nebenkosten percentages
│   │   └── translations.js # DE/EN strings
│   └── context/
│       └── LanguageContext.jsx
├── server.js               # Express API + static file server
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

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/properties` | List all properties |
| POST | `/api/properties` | Create a property |
| PUT | `/api/properties/:id` | Update a property |
| DELETE | `/api/properties/:id` | Delete a property |
| GET | `/api/zinsangebote?property_id=` | List interest offers for a property |
| POST | `/api/zinsangebote` | Create an interest offer |
| PUT | `/api/zinsangebote/:id` | Update an interest offer |
| DELETE | `/api/zinsangebote/:id` | Delete an interest offer |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server only |
| `npm run server` | Start Express API server only |
| `npm run dev:full` | Start both concurrently (recommended for development) |
| `npm run build` | Build the frontend for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build locally |
