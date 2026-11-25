# Trading Journal

A self-hosted, full-stack trading journal for importing trades, reviewing them day by day, keeping daily notes, and building strategies.

It has no external service dependencies, needs no API keys, and has no login: it runs as a single local user, with all data stored in a local file, so it works fully offline once dependencies are installed.

## Features

- **Dashboard**: stats, P&L calendar heatmap, and per-day trade list with account filters
- **Journal**: daily notes with a rich text editor
- **Strategies**: entry/exit/risk rules with color or emoji markers
- **CSV import**: generic column detection; multiple accounts per user
- **Trade review**: per-trade details (side, times, prices, P&L) with the rest of that day's trades alongside
- **Settings**: display name and connected accounts

## Tech stack

| Layer    | Stack |
|----------|-------|
| Frontend | React 19, Vite, Tailwind CSS v4, React Router, Zustand, Tiptap |
| Backend  | Express, TypeScript, Zod |
| Storage  | Local JSON file (`backend/data/db.json`) |
| Auth     | None. Single local user; run it on a machine or network you trust |

## Prerequisites

- **Node.js** 20+
- **Yarn** 1.x

## Quick start

This is a Yarn workspaces monorepo (`backend/` and `frontend/`). Run everything from the repo root:

```bash
yarn install   # installs both workspaces (the only step that needs network access)
yarn seed      # optional: load the sample trades
yarn dev       # API on http://localhost:3001 + web on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173). There is no login; the app opens straight to your journal.

### Root scripts

| Command | What it does |
|---------|--------------|
| `yarn dev` | Runs the API (tsx watch) and web (Vite) dev servers together |
| `yarn dev:api` / `yarn dev:web` | Runs just one of them |
| `yarn build` | Type-checks and builds both workspaces |
| `yarn start` | Serves the production builds (API + `vite preview`) |
| `yarn seed` | Clears the data store and loads `examples/sample-trades.csv` |
| `yarn generate:candles` | Regenerates the synthetic candlestick data from the sample CSV |
| `yarn lint` | Lints the frontend |

To run a command in a single workspace: `yarn workspace trade-journal-backend <script>` or `yarn workspace trade-journal-frontend <script>`.

If the default ports are taken, set them in the shell: `PORT=4001 WEB_PORT=4000 yarn dev`. The web dev server's `/api` proxy follows `PORT`.

No `.env` files are required. To override the defaults, copy the examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

| Variable | Where | Default | Description |
|----------|-------|---------|-------------|
| `PORT` | backend, web proxy | `3001` | API port (also the dev/preview proxy target) |
| `WEB_PORT` | frontend | `5173` | Web dev server port |
| `HOST` | backend | `127.0.0.1` | Bind address; use `0.0.0.0` only on a trusted network (e.g. inside a container) |
| `FRONTEND_URL` | backend | `http://localhost:5173` | Allowed CORS origin |
| `DATA_FILE` | backend | `backend/data/db.json` | JSON store path; `:memory:` disables persistence |
| `CANDLE_DATA_DIR` | backend | `sample-candlestick-data/` | Folder of 1-minute OHLCV candle files |
| `VITE_API_URL` | frontend | `/api` | API base URL (dev server proxies `/api` to port 3001) |

## Sample data

[`examples/sample-trades.csv`](./examples/sample-trades.csv) contains 59 fictional NQ and ES futures trades from July 2026 (made up; not anyone's real trading). Import it from **Dashboard → Import**, or run `yarn seed` from the root (this clears existing data first).

The CSV importer matches common column names, case-insensitively:

| Field | Accepted headers |
|-------|------------------|
| Symbol | `symbol`, `asset`, `ticker`, `instrument`, `contractname` |
| Entry time | `enteredat`, `entry_time`, `time`, `open_time`, `entry` |
| Exit time | `exitedat`, `exit_time`, `close_time`, `exit` |
| Date | `tradeday`, `date`, `trade_date`, `day`, `closed_at` |
| Side | `side`, `direction`, `type` (`long`/`buy` or `short`/`sell`) |
| Entry / exit price | `entryprice`, `entry_price`, `price`, … / `exitprice`, `exit_price`, … |
| PnL | `pnl`, `profit`, `net_pnl`, `pl`, `p&l` |

## Candlestick data

The backend serves 1-minute candles around each trade from `GET /api/charts/:tradeId`, using the OHLCV files in [`sample-candlestick-data/`](./sample-candlestick-data/README.md). The web app does not display charts.

- **Synthetic (committed, free):** `synthetic-sample.ohlcv-1m.json` is generated fake data that lines up with every sample trade, so sandboxes work out of the box. Regenerate it with `yarn generate:candles` (see the folder README for options).
- **Your own (local only):** any other candle files in the folder are gitignored and replace synthetic data for any day both cover. See the folder README for the format.

If no file covers a trade's day, the endpoint generates random candles on the fly.

## Project structure

```
trade-journal-webapp/
├── backend/
│   ├── src/
│   │   ├── db/           # JSON file store
│   │   ├── lib/          # CSV import and parsing, strategy rules, candle data
│   │   ├── middleware/   # attaches the local user to each request
│   │   ├── routes/       # Express API routes
│   │   ├── seed.ts       # sample data loader
│   │   └── generateCandles.ts # synthetic candlestick generator
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/        # route pages
│   │   ├── components/   # UI and layout
│   │   ├── stores/       # Zustand stores
│   │   └── lib/          # API client, utilities
│   └── .env.example
├── examples/             # sample CSV
├── sample-candlestick-data/     # synthetic candles (committed); other candle files gitignored
├── package.json          # workspace root and scripts
├── yarn.lock             # single lockfile for both workspaces
├── LICENSE
└── README.md
```

## API overview

No routes require authentication. Do not expose the backend to the public internet as-is; put it behind your own auth (for example a reverse proxy with basic auth) if it must be reachable remotely.

| Route prefix | Purpose |
|--------------|---------|
| `/api/users` | Local profile (`GET/PATCH /me`) |
| `/api/trades` | Trades, stats, calendar, CSV import |
| `/api/accounts` | Trading accounts |
| `/api/charts` | Candlestick data for a trade |
| `/api/strategies` | Trading strategies |
| `/api/journal` | Daily journal entries |

## Building for production

```bash
yarn build
yarn start   # API + vite preview (which proxies /api like the dev server)
```

For a real deployment, serve `frontend/dist` behind a reverse proxy that forwards `/api` to the backend, or set `VITE_API_URL` at build time.

The app is single-user by design. For larger deployments, swap `backend/src/db/store.ts` for a real database.

## License

[MIT](./LICENSE)
