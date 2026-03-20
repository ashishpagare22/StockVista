# StockVista

StockVista is a multi-market stock performance analysis starter project focused on `BSE`, `NSE`, and `NASDAQ`.

The repository is organized as a small product scaffold:

- `frontend/`: a Next.js dashboard shell for market tabs, search, date filters, and analysis cards
- `backend/`: a FastAPI service that exposes market metadata, stock search, and performance analysis endpoints
- `shared/`: shared market configuration artifacts
- `docs/`: product requirements, API contract, and calculation rules

The backend ships with a deterministic mock market-data provider so the app can be explored before a licensed market-data feed is integrated.

## Quick Start

### Easiest Way on Windows

After Python and Node.js are installed, you can start the whole app from the project root with:

```cmd
start-stockvista.bat
```

This opens separate backend and frontend terminal windows for you.

To refresh the local symbol/database catalog from the project root, run:

```cmd
refresh-stockvista-data.bat
```

If you have a raw NSE/BSE symbol file with mixed headers, normalize it first with:

```cmd
prepare-stockvista-import.bat NSE "C:\path\to\raw-file.csv"
prepare-stockvista-import.bat BSE "C:\path\to\raw-file.tsv"
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend expects the API at `http://127.0.0.1:8000` by default. Override it with `NEXT_PUBLIC_API_BASE_URL`.

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Windows Helper Scripts

- `start-stockvista.bat`: opens both services in separate Command Prompt windows
- `run-backend.bat`: starts the FastAPI backend
- `run-frontend.bat`: starts the Next.js frontend
- `refresh-stockvista-data.bat`: refreshes the local stock catalog and SQLite database
- `prepare-stockvista-import.bat`: cleans raw NSE/BSE/NASDAQ symbol files into StockVista CSV format

The helper scripts will create missing local setup pieces like the Python virtual environment and frontend dependencies when needed.

If you hit a Next.js `ChunkLoadError` in development, use `start-stockvista.bat` or `run-frontend.bat`. They now reset the `.next` dev cache before starting the frontend.

## Local Database Mode

StockVista now keeps a local SQLite database under `backend/data/stockvista.db`.

- symbol masters can be imported into `backend/data/imports/`
- Nasdaq can bootstrap from the SEC ticker/exchange file
- historical price data is cached on demand when you analyze a stock
- the cache can be refreshed from the UI or with `python -m app.sync`

### Example API Call

```bash
curl "http://127.0.0.1:8000/analysis?exchange=NSE&query=Reliance&start_date=2026-01-02&end_date=2026-03-13"
```

## Current State

- UI scaffold is ready for build-out
- API endpoints are wired and return computed analysis payloads from mock data
- Core calculations are documented and unit-tested
- Real vendor integration is intentionally left as the next implementation step

## Next Build Milestones

1. Replace the mock data provider with a production market-data adapter
2. Add persistent symbol caching and benchmark history storage
3. Add authentication, watchlists, and export features
