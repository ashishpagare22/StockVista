from __future__ import annotations

from datetime import date, timedelta

from fastapi import APIRouter, HTTPException, Query

from app.services.analytics.performance import build_analysis_response
from app.schemas.analysis import CorporateAction, RefreshRunResponse, RefreshStatusResponse, SeriesPoint
from app.services.market_data.store import (
    get_corporate_actions,
    get_price_history,
    list_markets,
    search_instruments,
)
from app.services.market_data.sync_service import (
    build_refresh_status,
    prepare_analysis_cache,
    refresh_catalogs,
    refresh_symbol_history,
)
from app.utils.date_utils import resolve_date_range


router = APIRouter()


@router.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/markets")
def markets():
    return list_markets()


@router.get("/stocks/search")
def stock_search(
    exchange: str = Query(..., min_length=2),
    query: str = Query(..., min_length=1),
):
    try:
        return search_instruments(exchange, query)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/analysis")
def analysis(
    exchange: str = Query(..., min_length=2),
    query: str = Query(..., min_length=1),
    start_date: date | None = None,
    end_date: date | None = None,
):
    try:
        resolved_start, resolved_end = resolve_date_range(start_date, end_date)
        stock, benchmark = prepare_analysis_cache(exchange, query, resolved_start, resolved_end)
        extended_start = resolved_start - timedelta(days=80)
        history = get_price_history(int(stock["id"]), resolved_start, resolved_end)
        extended_history = get_price_history(int(stock["id"]), extended_start, resolved_end)
        benchmark_history = get_price_history(int(benchmark["id"]), resolved_start, resolved_end)
        if not history:
            raise ValueError(f"No cached history is available for '{query}' in {exchange.upper()}.")
        corporate_actions = [
            CorporateAction(
                action_date=event["action_date"],
                action_type=str(event["action_type"]),
                description=str(event["description"]),
            )
            for event in get_corporate_actions(int(stock["id"]), resolved_start, resolved_end)
        ]
        benchmark_series = [
            SeriesPoint(date=point["date"], value=round(float(point["close"]), 2))
            for point in benchmark_history
        ]
        return build_analysis_response(
            exchange=exchange,
            query=query,
            stock=stock,
            history=history,
            indicator_history=extended_history,
            benchmark_series=benchmark_series,
            corporate_actions=corporate_actions,
            start_date=resolved_start,
            end_date=resolved_end,
        )
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/refresh/status", response_model=RefreshStatusResponse)
def refresh_status():
    return build_refresh_status()


@router.post("/refresh/catalogs", response_model=RefreshRunResponse)
def refresh_catalogs_endpoint(include_nasdaq: bool = True):
    try:
        payload = refresh_catalogs(include_remote_nasdaq=include_nasdaq)
        return RefreshRunResponse(message=payload["message"], details=payload)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/refresh/history", response_model=RefreshRunResponse)
def refresh_history_endpoint(
    exchange: str = Query(..., min_length=2),
    query: str = Query(..., min_length=1),
    days_back: int | None = Query(default=None, ge=30, le=3650),
):
    try:
        payload = refresh_symbol_history(exchange=exchange, query=query, days_back=days_back, force=True)
        return RefreshRunResponse(
            message=payload["message"],
            exchange=payload["exchange"],
            query=payload["query"],
            days_back=payload["days_back"],
            details=payload,
        )
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
