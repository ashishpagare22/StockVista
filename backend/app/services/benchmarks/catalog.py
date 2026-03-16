from __future__ import annotations

import math
from datetime import date

from app.schemas.analysis import MarketDescriptor, SeriesPoint
from app.utils.date_utils import iter_business_days


MARKET_METADATA = {
    "BSE": {
        "benchmark": "Sensex",
        "currency": "INR",
        "timezone": "Asia/Kolkata",
        "base_price": 73500.0,
        "drift": 0.00035,
        "volatility": 0.008,
    },
    "NSE": {
        "benchmark": "Nifty 50",
        "currency": "INR",
        "timezone": "Asia/Kolkata",
        "base_price": 22250.0,
        "drift": 0.0004,
        "volatility": 0.009,
    },
    "NASDAQ": {
        "benchmark": "Nasdaq Composite",
        "currency": "USD",
        "timezone": "America/New_York",
        "base_price": 18300.0,
        "drift": 0.00055,
        "volatility": 0.011,
    },
}


def get_market_descriptor(exchange: str) -> MarketDescriptor:
    metadata = MARKET_METADATA.get(exchange.upper())
    if not metadata:
        raise ValueError(f"Unsupported exchange '{exchange}'.")

    return MarketDescriptor(
        code=exchange.upper(),
        benchmark=metadata["benchmark"],
        currency=metadata["currency"],
        timezone=metadata["timezone"],
    )


def build_benchmark_series(exchange: str, start_date: date, end_date: date) -> list[SeriesPoint]:
    metadata = MARKET_METADATA.get(exchange.upper())
    if not metadata:
        raise ValueError(f"Unsupported exchange '{exchange}'.")

    series: list[SeriesPoint] = []
    business_days = iter_business_days(start_date, end_date)
    for index, day in enumerate(business_days):
        cycle = math.sin((day.toordinal() % 17) / 4) * metadata["volatility"]
        trend = 1 + (metadata["drift"] * index)
        close = round(metadata["base_price"] * trend * (1 + cycle), 2)
        series.append(SeriesPoint(date=day, value=close))

    return series
