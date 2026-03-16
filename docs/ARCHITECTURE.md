# Architecture Overview

## Frontend

The frontend is a Next.js app-router project with a single dashboard page. It organizes the UI into small feature modules:

- market selection
- search and date filters
- analysis cards
- chart rendering

## Backend

The backend is a FastAPI application with three layers:

- `api`: request and response routing
- `services`: market data, benchmark data, and analytics
- `schemas`: typed API contracts

## Data Flow

1. Frontend collects exchange, stock query, and date range
2. Backend resolves the stock inside the selected market
3. Mock provider generates deterministic historical prices
4. Analytics layer computes returns, indicators, and benchmark deltas
5. Frontend renders sections and charts from the returned payload

## Upgrade Path

- Swap the mock provider for a real market-data adapter
- Persist symbol metadata and benchmark history in PostgreSQL
- Add Redis caching in front of high-traffic analysis requests
