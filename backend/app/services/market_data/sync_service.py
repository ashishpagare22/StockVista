from __future__ import annotations

from datetime import date, timedelta

from app.core.config import settings
from app.core.database import initialize_database
from app.services.market_data.catalog_sources import (
    build_benchmark_seeds,
    build_demo_equity_seeds,
    expected_import_files,
    load_csv_catalogs,
    load_sec_nasdaq_catalog,
)
from app.services.market_data.history_provider import fetch_history_from_yahoo
from app.services.market_data.store import (
    finish_sync_run,
    get_benchmark_instrument,
    get_price_window,
    list_market_status,
    resolve_instrument,
    start_sync_run,
    upsert_corporate_actions,
    upsert_instruments,
    upsert_markets,
    upsert_price_history,
)


def bootstrap_local_store(include_remote_nasdaq: bool = True) -> dict[str, object]:
    initialize_database()
    upsert_markets()

    benchmark_count = upsert_instruments(build_benchmark_seeds())
    demo_count = upsert_instruments(build_demo_equity_seeds())
    csv_seeds, notes = load_csv_catalogs(settings.imports_path)
    csv_count = upsert_instruments(csv_seeds)

    nasdaq_count = 0
    if include_remote_nasdaq:
        try:
            nasdaq_seeds = load_sec_nasdaq_catalog()
        except Exception as error:  # pragma: no cover - depends on local network
            notes.append(f"NASDAQ SEC import skipped: {error}")
        else:
            nasdaq_count = upsert_instruments(nasdaq_seeds)
            notes.append(f"NASDAQ: loaded {nasdaq_count} instruments from SEC ticker file")

    return {
        "benchmarks": benchmark_count,
        "demo_seeds": demo_count,
        "csv_imports": csv_count,
        "nasdaq_imports": nasdaq_count,
        "notes": notes,
    }


def _needs_refresh(instrument_id: int, start_date: date, end_date: date, force: bool = False) -> bool:
    if force:
        return True

    window = get_price_window(instrument_id)
    earliest = window["earliest_date"]
    latest = window["latest_date"]
    if earliest is None or latest is None:
        return True
    return earliest > start_date or latest < end_date


def ensure_history_cached(
    instrument: dict[str, object],
    start_date: date,
    end_date: date,
    force: bool = False,
) -> dict[str, object]:
    if not _needs_refresh(int(instrument["id"]), start_date, end_date, force=force):
        return {
            "exchange": instrument["exchange"],
            "symbol": instrument["symbol"],
            "price_points": 0,
            "message": "Cache already covered the requested range.",
        }

    run_id = start_sync_run(
        exchange=str(instrument["exchange"]),
        target_symbol=str(instrument["symbol"]),
        run_type="history_refresh",
        source=str(instrument["source"]),
        message=f"Refreshing {instrument['symbol']} price history",
    )

    try:
        prices, actions = fetch_history_from_yahoo(
            yahoo_symbol=str(instrument["yahoo_symbol"]),
            start_date=start_date,
            end_date=end_date,
        )
        if not prices:
            raise ValueError(f"No historical data was returned for {instrument['symbol']}.")

        price_points = upsert_price_history(
            instrument_id=int(instrument["id"]),
            bars=prices,
            source="yahoo_finance",
        )
        action_count = upsert_corporate_actions(
            instrument_id=int(instrument["id"]),
            actions=actions,
            source="yahoo_finance",
        )
        message = (
            f"Refreshed {instrument['symbol']} from {prices[0].trade_date.isoformat()} "
            f"to {prices[-1].trade_date.isoformat()}."
        )
        finish_sync_run(
            run_id=run_id,
            status="success",
            message=message,
            instrument_count=1,
            price_points=price_points,
        )
        return {
            "exchange": instrument["exchange"],
            "symbol": instrument["symbol"],
            "price_points": price_points,
            "corporate_actions": action_count,
            "message": message,
        }
    except Exception as error:
        finish_sync_run(
            run_id=run_id,
            status="failed",
            message=str(error),
            instrument_count=1,
            price_points=0,
        )
        raise


def prepare_analysis_cache(exchange: str, query: str, start_date: date, end_date: date) -> tuple[dict[str, object], dict[str, object]]:
    extended_start = start_date - timedelta(days=80)
    equity = resolve_instrument(exchange, query, instrument_type="equity")
    benchmark = get_benchmark_instrument(exchange.upper())

    ensure_history_cached(equity, extended_start, end_date)
    ensure_history_cached(benchmark, start_date, end_date)
    return equity, benchmark


def build_refresh_status() -> dict[str, object]:
    return {
        "database_path": str(settings.database_path),
        "imports_path": str(settings.imports_path),
        "refresh_mode": "local-cache-on-demand",
        "auto_refresh_on_startup": settings.auto_refresh_on_startup,
        "default_history_days": settings.default_history_days,
        "expected_imports": expected_import_files(settings.imports_path),
        "markets": list_market_status(),
    }


def refresh_catalogs(include_remote_nasdaq: bool = True) -> dict[str, object]:
    run_id = start_sync_run(
        exchange="ALL",
        target_symbol=None,
        run_type="catalog_refresh",
        source="bootstrap",
        message="Refreshing local stock catalogs",
    )

    try:
        summary = bootstrap_local_store(include_remote_nasdaq=include_remote_nasdaq)
        message = "Catalog refresh completed."
        finish_sync_run(
            run_id=run_id,
            status="success",
            message=message,
            instrument_count=int(summary["benchmarks"]) + int(summary["demo_seeds"]) + int(summary["csv_imports"]) + int(summary["nasdaq_imports"]),
            price_points=0,
        )
        summary["message"] = message
        return summary
    except Exception as error:
        finish_sync_run(
            run_id=run_id,
            status="failed",
            message=str(error),
            instrument_count=0,
            price_points=0,
        )
        raise


def refresh_symbol_history(exchange: str, query: str, days_back: int | None = None, force: bool = True) -> dict[str, object]:
    history_days = days_back or settings.default_history_days
    end_date = date.today()
    start_date = end_date - timedelta(days=history_days)

    instrument = resolve_instrument(exchange, query, instrument_type="equity")
    benchmark = get_benchmark_instrument(exchange.upper())
    equity_summary = ensure_history_cached(instrument, start_date, end_date, force=force)
    benchmark_summary = ensure_history_cached(benchmark, start_date, end_date, force=force)

    return {
        "message": f"Refreshed local history for {instrument['symbol']} and its benchmark.",
        "exchange": exchange.upper(),
        "query": query,
        "days_back": history_days,
        "equity": equity_summary,
        "benchmark": benchmark_summary,
    }
