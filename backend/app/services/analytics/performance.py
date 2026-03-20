from __future__ import annotations

import math
from statistics import fmean, pstdev

from app.schemas.analysis import (
    AnalysisResponse,
    BenchmarkComparison,
    PriceSnapshot,
    QueryWindow,
    ReturnMetrics,
    SeriesPoint,
    StockOverview,
    TechnicalSnapshot,
)
from app.services.benchmarks.catalog import get_market_descriptor


def _closing_values(history: list[dict[str, object]]) -> list[float]:
    return [float(point["close"]) for point in history]


def _daily_returns(closes: list[float]) -> list[float]:
    returns: list[float] = []
    for previous, current in zip(closes, closes[1:]):
        if previous:
            returns.append((current - previous) / previous)
    return returns


def moving_average(closes: list[float], period: int) -> float:
    window = closes[-period:] if len(closes) >= period else closes
    if not window:
        return 0.0
    return round(fmean(window), 2)


def relative_strength_index(closes: list[float], period: int = 14) -> float:
    if len(closes) < 2:
        return 50.0

    deltas = [current - previous for previous, current in zip(closes, closes[1:])]
    window = deltas[-period:] if len(deltas) >= period else deltas
    gains = [delta for delta in window if delta > 0]
    losses = [abs(delta) for delta in window if delta < 0]

    average_gain = fmean(gains) if gains else 0.0
    average_loss = fmean(losses) if losses else 0.0

    if average_loss == 0:
        return 100.0 if average_gain > 0 else 50.0

    rs = average_gain / average_loss
    return round(100 - (100 / (1 + rs)), 2)


def calculate_return_metrics(history: list[dict[str, object]]) -> ReturnMetrics:
    closes = _closing_values(history)
    if not closes:
        return ReturnMetrics(
            absolute_return=0.0,
            percent_return=0.0,
            annualized_volatility=0.0,
            max_drawdown=0.0,
        )

    absolute_return = closes[-1] - closes[0]
    percent_return = (absolute_return / closes[0]) * 100 if closes[0] else 0.0

    daily_returns = _daily_returns(closes)
    annualized_volatility = 0.0
    if len(daily_returns) > 1:
        annualized_volatility = pstdev(daily_returns) * math.sqrt(252) * 100

    peak = closes[0]
    max_drawdown = 0.0
    for close in closes:
        peak = max(peak, close)
        drawdown = ((close - peak) / peak) * 100 if peak else 0.0
        max_drawdown = min(max_drawdown, drawdown)

    return ReturnMetrics(
        absolute_return=round(absolute_return, 2),
        percent_return=round(percent_return, 2),
        annualized_volatility=round(annualized_volatility, 2),
        max_drawdown=round(max_drawdown, 2),
    )


def calculate_benchmark_return(benchmark_series: list[SeriesPoint]) -> float:
    if not benchmark_series:
        return 0.0
    start_value = benchmark_series[0].value
    end_value = benchmark_series[-1].value
    return round(((end_value - start_value) / start_value) * 100, 2)


def build_summary(percent_return: float, volatility: float, relative_performance: float) -> str:
    if percent_return >= 12:
        trend = "a strong upward trend"
    elif percent_return >= 3:
        trend = "a steady positive trend"
    elif percent_return <= -12:
        trend = "a sharp pullback"
    elif percent_return <= -3:
        trend = "a mild downtrend"
    else:
        trend = "a range-bound profile"

    if volatility >= 30:
        risk = "elevated volatility"
    elif volatility >= 18:
        risk = "moderate volatility"
    else:
        risk = "contained volatility"

    if relative_performance >= 3:
        comparison = "outperformed its benchmark"
    elif relative_performance <= -3:
        comparison = "lagged its benchmark"
    else:
        comparison = "tracked close to its benchmark"

    return f"The stock showed {trend} over the selected range, with {risk}, and {comparison}."


def build_analysis_response(
    exchange: str,
    query: str,
    stock: dict[str, object],
    history: list[dict[str, object]],
    indicator_history: list[dict[str, object]] | None,
    benchmark_series: list[SeriesPoint],
    corporate_actions,
    start_date,
    end_date,
) -> AnalysisResponse:
    if not history:
        raise ValueError("No price history available for the selected range.")

    market = get_market_descriptor(exchange)
    closes = _closing_values(indicator_history or history)
    returns = calculate_return_metrics(history)
    benchmark_return = calculate_benchmark_return(benchmark_series)
    relative_performance = round(returns.percent_return - benchmark_return, 2)

    latest = history[-1]
    previous_close = float(history[-2]["close"]) if len(history) > 1 else float(latest["close"])
    day_change_percent = (
        ((float(latest["close"]) - previous_close) / previous_close) * 100 if previous_close else 0.0
    )

    return AnalysisResponse(
        market=market,
        overview=StockOverview(
            symbol=str(stock["symbol"]),
            company_name=str(stock["name"]),
            exchange=exchange.upper(),
            sector=str(stock["sector"]),
            currency=market.currency,
        ),
        input=QueryWindow(query=query, start_date=start_date, end_date=end_date),
        price_snapshot=PriceSnapshot(
            as_of=latest["date"],
            open=round(float(latest["open"]), 2),
            high=round(float(latest["high"]), 2),
            low=round(float(latest["low"]), 2),
            close=round(float(latest["close"]), 2),
            volume=int(latest["volume"]),
            day_change_percent=round(day_change_percent, 2),
        ),
        returns=returns,
        technicals=TechnicalSnapshot(
            moving_average_20=moving_average(closes, 20),
            moving_average_50=moving_average(closes, 50),
            rsi_14=relative_strength_index(closes, 14),
        ),
        benchmark=BenchmarkComparison(
            benchmark_name=market.benchmark,
            benchmark_return=benchmark_return,
            relative_performance=relative_performance,
        ),
        corporate_actions=corporate_actions,
        series=[SeriesPoint(date=point["date"], value=round(float(point["close"]), 2)) for point in history],
        benchmark_series=benchmark_series,
        summary=build_summary(
            returns.percent_return,
            returns.annualized_volatility,
            relative_performance,
        ),
    )
