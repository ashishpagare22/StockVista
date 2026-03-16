from __future__ import annotations

from datetime import date

from fastapi import APIRouter, HTTPException, Query

from app.services.analytics.performance import build_analysis_response
from app.services.benchmarks.catalog import build_benchmark_series
from app.services.market_data.mock_provider import (
    build_price_history,
    get_corporate_actions,
    list_markets,
    resolve_stock,
    search_stocks,
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
        return search_stocks(exchange, query)
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
        stock = resolve_stock(exchange, query)
        history = build_price_history(stock, resolved_start, resolved_end)
        benchmark_series = build_benchmark_series(exchange, resolved_start, resolved_end)
        corporate_actions = get_corporate_actions(str(stock["symbol"]), resolved_start, resolved_end)
        return build_analysis_response(
            exchange=exchange,
            query=query,
            stock=stock,
            history=history,
            benchmark_series=benchmark_series,
            corporate_actions=corporate_actions,
            start_date=resolved_start,
            end_date=resolved_end,
        )
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
