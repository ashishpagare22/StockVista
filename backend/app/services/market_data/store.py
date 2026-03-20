from __future__ import annotations

from datetime import date, datetime, timezone
import json

from app.core.database import db_connection
from app.schemas.analysis import MarketDescriptor, StockSearchResult
from app.services.benchmarks.catalog import MARKET_METADATA
from app.services.market_data.catalog_sources import InstrumentSeed
from app.services.market_data.history_provider import ActionEvent, PriceBar


def _utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def upsert_markets() -> None:
    rows = [
        (
            code,
            metadata["benchmark"],
            metadata["benchmark_symbol"],
            metadata["benchmark_yahoo_symbol"],
            metadata["currency"],
            metadata["timezone"],
        )
        for code, metadata in MARKET_METADATA.items()
    ]
    with db_connection() as connection:
        connection.executemany(
            """
            INSERT INTO markets (
                code, benchmark, benchmark_symbol, benchmark_yahoo_symbol, currency, timezone
            ) VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(code) DO UPDATE SET
                benchmark = excluded.benchmark,
                benchmark_symbol = excluded.benchmark_symbol,
                benchmark_yahoo_symbol = excluded.benchmark_yahoo_symbol,
                currency = excluded.currency,
                timezone = excluded.timezone
            """,
            rows,
        )


def upsert_instruments(seeds: list[InstrumentSeed]) -> int:
    if not seeds:
        return 0

    timestamp = _utcnow_iso()
    rows = [
        (
            seed.exchange,
            seed.symbol,
            seed.company_name,
            seed.sector,
            seed.currency,
            seed.yahoo_symbol,
            seed.instrument_type,
            seed.source,
            seed.metadata_json,
            timestamp,
            timestamp,
        )
        for seed in seeds
    ]

    with db_connection() as connection:
        connection.executemany(
            """
            INSERT INTO instruments (
                exchange, symbol, company_name, sector, currency, yahoo_symbol,
                instrument_type, source, metadata_json, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(exchange, symbol, instrument_type) DO UPDATE SET
                company_name = excluded.company_name,
                sector = excluded.sector,
                currency = excluded.currency,
                yahoo_symbol = excluded.yahoo_symbol,
                source = excluded.source,
                metadata_json = excluded.metadata_json,
                is_active = 1,
                updated_at = excluded.updated_at
            """,
            rows,
        )

    return len(rows)


def _row_to_instrument(row) -> dict[str, object]:
    return {
        "id": int(row["id"]),
        "exchange": row["exchange"],
        "symbol": row["symbol"],
        "name": row["company_name"],
        "sector": row["sector"],
        "currency": row["currency"],
        "yahoo_symbol": row["yahoo_symbol"],
        "instrument_type": row["instrument_type"],
        "source": row["source"],
        "metadata": json.loads(row["metadata_json"] or "{}"),
    }


def list_markets() -> list[MarketDescriptor]:
    with db_connection() as connection:
        rows = connection.execute(
            """
            SELECT code, benchmark, currency, timezone
            FROM markets
            ORDER BY code
            """
        ).fetchall()

    return [
        MarketDescriptor(
            code=row["code"],
            benchmark=row["benchmark"],
            currency=row["currency"],
            timezone=row["timezone"],
        )
        for row in rows
    ]


def search_instruments(exchange: str, query: str, limit: int = 12) -> list[StockSearchResult]:
    normalized_query = query.strip().lower()
    if not normalized_query:
        return []

    with db_connection() as connection:
        rows = connection.execute(
            """
            SELECT symbol, company_name, exchange, sector, currency
            FROM instruments
            WHERE exchange = ?
              AND instrument_type = 'equity'
              AND is_active = 1
              AND (
                LOWER(symbol) LIKE ?
                OR LOWER(company_name) LIKE ?
              )
            ORDER BY
              CASE
                WHEN LOWER(symbol) = ? THEN 0
                WHEN LOWER(company_name) = ? THEN 1
                WHEN LOWER(symbol) LIKE ? THEN 2
                ELSE 3
              END,
              company_name
            LIMIT ?
            """,
            (
                exchange.upper(),
                f"%{normalized_query}%",
                f"%{normalized_query}%",
                normalized_query,
                normalized_query,
                f"{normalized_query}%",
                limit,
            ),
        ).fetchall()

    return [
        StockSearchResult(
            symbol=row["symbol"],
            name=row["company_name"],
            exchange=row["exchange"],
            sector=row["sector"],
            currency=row["currency"],
        )
        for row in rows
    ]


def resolve_instrument(exchange: str, query: str, instrument_type: str = "equity") -> dict[str, object]:
    normalized_query = query.strip().lower()
    if not normalized_query:
        raise ValueError("query cannot be empty.")

    with db_connection() as connection:
        row = connection.execute(
            """
            SELECT *
            FROM instruments
            WHERE exchange = ?
              AND instrument_type = ?
              AND is_active = 1
              AND (LOWER(symbol) = ? OR LOWER(company_name) = ?)
            ORDER BY symbol
            LIMIT 1
            """,
            (exchange.upper(), instrument_type, normalized_query, normalized_query),
        ).fetchone()

        if row is None:
            row = connection.execute(
                """
                SELECT *
                FROM instruments
                WHERE exchange = ?
                  AND instrument_type = ?
                  AND is_active = 1
                  AND (
                    LOWER(symbol) LIKE ?
                    OR LOWER(company_name) LIKE ?
                  )
                ORDER BY
                  CASE
                    WHEN LOWER(symbol) LIKE ? THEN 0
                    ELSE 1
                  END,
                  company_name
                LIMIT 1
                """,
                (
                    exchange.upper(),
                    instrument_type,
                    f"%{normalized_query}%",
                    f"%{normalized_query}%",
                    f"{normalized_query}%",
                ),
            ).fetchone()

    if row is None:
        raise LookupError(f"Could not find '{query}' in {exchange.upper()}.")

    return _row_to_instrument(row)


def get_benchmark_instrument(exchange: str) -> dict[str, object]:
    benchmark_symbol = str(MARKET_METADATA[exchange.upper()]["benchmark_symbol"])
    return resolve_instrument(exchange, benchmark_symbol, instrument_type="benchmark")


def get_price_window(instrument_id: int) -> dict[str, object]:
    with db_connection() as connection:
        row = connection.execute(
            """
            SELECT MIN(trade_date) AS earliest_date,
                   MAX(trade_date) AS latest_date,
                   COUNT(*) AS row_count
            FROM daily_prices
            WHERE instrument_id = ?
            """,
            (instrument_id,),
        ).fetchone()

    earliest = date.fromisoformat(row["earliest_date"]) if row["earliest_date"] else None
    latest = date.fromisoformat(row["latest_date"]) if row["latest_date"] else None
    return {
        "earliest_date": earliest,
        "latest_date": latest,
        "row_count": int(row["row_count"] or 0),
    }


def upsert_price_history(instrument_id: int, bars: list[PriceBar], source: str) -> int:
    if not bars:
        return 0

    timestamp = _utcnow_iso()
    rows = [
        (
            instrument_id,
            bar.trade_date.isoformat(),
            bar.open,
            bar.high,
            bar.low,
            bar.close,
            bar.adj_close,
            bar.volume,
            source,
            timestamp,
        )
        for bar in bars
    ]

    with db_connection() as connection:
        connection.executemany(
            """
            INSERT INTO daily_prices (
                instrument_id, trade_date, open, high, low, close, adj_close, volume, source, inserted_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(instrument_id, trade_date) DO UPDATE SET
                open = excluded.open,
                high = excluded.high,
                low = excluded.low,
                close = excluded.close,
                adj_close = excluded.adj_close,
                volume = excluded.volume,
                source = excluded.source,
                inserted_at = excluded.inserted_at
            """,
            rows,
        )

    return len(rows)


def get_price_history(instrument_id: int, start_date: date, end_date: date) -> list[dict[str, object]]:
    with db_connection() as connection:
        rows = connection.execute(
            """
            SELECT trade_date, open, high, low, close, adj_close, volume
            FROM daily_prices
            WHERE instrument_id = ?
              AND trade_date >= ?
              AND trade_date <= ?
            ORDER BY trade_date
            """,
            (instrument_id, start_date.isoformat(), end_date.isoformat()),
        ).fetchall()

    return [
        {
            "date": date.fromisoformat(row["trade_date"]),
            "open": float(row["open"]),
            "high": float(row["high"]),
            "low": float(row["low"]),
            "close": float(row["close"]),
            "adj_close": float(row["adj_close"]),
            "volume": int(row["volume"]),
        }
        for row in rows
    ]


def upsert_corporate_actions(instrument_id: int, actions: list[ActionEvent], source: str) -> int:
    if not actions:
        return 0

    timestamp = _utcnow_iso()
    rows = [
        (
            instrument_id,
            action.action_date.isoformat(),
            action.action_type,
            action.description,
            source,
            timestamp,
        )
        for action in actions
    ]

    with db_connection() as connection:
        connection.executemany(
            """
            INSERT INTO corporate_actions (
                instrument_id, action_date, action_type, description, source, inserted_at
            ) VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(instrument_id, action_date, action_type, description) DO UPDATE SET
                source = excluded.source,
                inserted_at = excluded.inserted_at
            """,
            rows,
        )

    return len(rows)


def get_corporate_actions(instrument_id: int, start_date: date, end_date: date) -> list[dict[str, object]]:
    with db_connection() as connection:
        rows = connection.execute(
            """
            SELECT action_date, action_type, description
            FROM corporate_actions
            WHERE instrument_id = ?
              AND action_date >= ?
              AND action_date <= ?
            ORDER BY action_date
            """,
            (instrument_id, start_date.isoformat(), end_date.isoformat()),
        ).fetchall()

    return [
        {
            "action_date": date.fromisoformat(row["action_date"]),
            "action_type": row["action_type"],
            "description": row["description"],
        }
        for row in rows
    ]


def start_sync_run(
    exchange: str,
    run_type: str,
    source: str,
    message: str,
    target_symbol: str | None = None,
) -> int:
    started_at = _utcnow_iso()
    with db_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO sync_runs (
                exchange, target_symbol, run_type, status, source, message, started_at
            ) VALUES (?, ?, ?, 'running', ?, ?, ?)
            """,
            (exchange, target_symbol, run_type, source, message, started_at),
        )
        return int(cursor.lastrowid)


def finish_sync_run(
    run_id: int,
    status: str,
    message: str,
    instrument_count: int = 0,
    price_points: int = 0,
) -> None:
    completed_at = _utcnow_iso()
    with db_connection() as connection:
        connection.execute(
            """
            UPDATE sync_runs
            SET status = ?,
                message = ?,
                completed_at = ?,
                instrument_count = ?,
                price_points = ?
            WHERE id = ?
            """,
            (status, message, completed_at, instrument_count, price_points, run_id),
        )


def list_market_status() -> list[dict[str, object]]:
    status_rows: list[dict[str, object]] = []

    with db_connection() as connection:
        markets = connection.execute(
            """
            SELECT code, benchmark, currency, timezone
            FROM markets
            ORDER BY code
            """
        ).fetchall()

        for market in markets:
            exchange = market["code"]
            counts = connection.execute(
                """
                SELECT
                    SUM(CASE WHEN instrument_type = 'equity' THEN 1 ELSE 0 END) AS equity_count,
                    SUM(CASE WHEN instrument_type = 'benchmark' THEN 1 ELSE 0 END) AS benchmark_count
                FROM instruments
                WHERE exchange = ? AND is_active = 1
                """,
                (exchange,),
            ).fetchone()

            priced = connection.execute(
                """
                SELECT COUNT(DISTINCT instruments.id) AS cached_symbols,
                       MIN(daily_prices.trade_date) AS earliest_date,
                       MAX(daily_prices.trade_date) AS latest_date
                FROM instruments
                LEFT JOIN daily_prices ON daily_prices.instrument_id = instruments.id
                WHERE instruments.exchange = ?
                  AND instruments.instrument_type = 'equity'
                  AND instruments.is_active = 1
                """,
                (exchange,),
            ).fetchone()

            last_sync = connection.execute(
                """
                SELECT status, message, completed_at
                FROM sync_runs
                WHERE exchange = ?
                ORDER BY id DESC
                LIMIT 1
                """,
                (exchange,),
            ).fetchone()

            status_rows.append(
                {
                    "code": exchange,
                    "benchmark": market["benchmark"],
                    "currency": market["currency"],
                    "timezone": market["timezone"],
                    "instrument_count": int(counts["equity_count"] or 0),
                    "benchmark_count": int(counts["benchmark_count"] or 0),
                    "cached_symbol_count": int(priced["cached_symbols"] or 0),
                    "earliest_cached_date": priced["earliest_date"],
                    "latest_cached_date": priced["latest_date"],
                    "last_sync_status": last_sync["status"] if last_sync else None,
                    "last_sync_completed_at": last_sync["completed_at"] if last_sync else None,
                    "last_sync_message": last_sync["message"] if last_sync else None,
                }
            )

    return status_rows
