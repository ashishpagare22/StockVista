from __future__ import annotations

import math
from datetime import date

from app.schemas.analysis import CorporateAction, StockSearchResult
from app.services.benchmarks.catalog import MARKET_METADATA
from app.utils.date_utils import iter_business_days


STOCK_CATALOG: dict[str, list[dict[str, object]]] = {
    "BSE": [
        {
            "symbol": "TCS",
            "name": "Tata Consultancy Services",
            "sector": "Information Technology",
            "base_price": 4060.0,
            "drift": 0.00045,
            "volatility": 0.016,
            "base_volume": 1350000,
        },
        {
            "symbol": "HDFCBANK",
            "name": "HDFC Bank",
            "sector": "Financial Services",
            "base_price": 1675.0,
            "drift": 0.00035,
            "volatility": 0.014,
            "base_volume": 1840000,
        },
        {
            "symbol": "SBIN",
            "name": "State Bank of India",
            "sector": "Banking",
            "base_price": 815.0,
            "drift": 0.0005,
            "volatility": 0.02,
            "base_volume": 3150000,
        },
    ],
    "NSE": [
        {
            "symbol": "RELIANCE",
            "name": "Reliance Industries",
            "sector": "Energy",
            "base_price": 2920.0,
            "drift": 0.00055,
            "volatility": 0.018,
            "base_volume": 4100000,
        },
        {
            "symbol": "INFY",
            "name": "Infosys",
            "sector": "Information Technology",
            "base_price": 1635.0,
            "drift": 0.00042,
            "volatility": 0.017,
            "base_volume": 2800000,
        },
        {
            "symbol": "TATAMOTORS",
            "name": "Tata Motors",
            "sector": "Automobile",
            "base_price": 1045.0,
            "drift": 0.00062,
            "volatility": 0.024,
            "base_volume": 5200000,
        },
    ],
    "NASDAQ": [
        {
            "symbol": "AAPL",
            "name": "Apple Inc.",
            "sector": "Consumer Electronics",
            "base_price": 224.0,
            "drift": 0.0007,
            "volatility": 0.015,
            "base_volume": 65000000,
        },
        {
            "symbol": "MSFT",
            "name": "Microsoft Corporation",
            "sector": "Software",
            "base_price": 428.0,
            "drift": 0.00068,
            "volatility": 0.014,
            "base_volume": 29000000,
        },
        {
            "symbol": "NVDA",
            "name": "NVIDIA Corporation",
            "sector": "Semiconductors",
            "base_price": 876.0,
            "drift": 0.00095,
            "volatility": 0.028,
            "base_volume": 51500000,
        },
    ],
}

CORPORATE_ACTIONS: dict[str, list[dict[str, object]]] = {
    "RELIANCE": [
        {"action_date": date(2026, 1, 15), "action_type": "Dividend", "description": "Interim dividend announcement"},
    ],
    "INFY": [
        {"action_date": date(2026, 2, 2), "action_type": "Buyback", "description": "Board approved buyback review"},
    ],
    "AAPL": [
        {"action_date": date(2026, 2, 6), "action_type": "Dividend", "description": "Quarterly dividend declaration"},
    ],
    "NVDA": [
        {"action_date": date(2026, 1, 27), "action_type": "Split", "description": "Illustrative split event in mock dataset"},
    ],
}


def list_markets() -> list[dict[str, str]]:
    return [
        {
            "code": code,
            "benchmark": metadata["benchmark"],
            "currency": metadata["currency"],
            "timezone": metadata["timezone"],
        }
        for code, metadata in MARKET_METADATA.items()
    ]


def search_stocks(exchange: str, query: str) -> list[StockSearchResult]:
    if not query.strip():
        return []

    exchange_code = exchange.upper()
    if exchange_code not in STOCK_CATALOG:
        raise ValueError(f"Unsupported exchange '{exchange}'.")

    currency = MARKET_METADATA[exchange_code]["currency"]
    normalized_query = query.strip().lower()
    matches = []

    for stock in STOCK_CATALOG[exchange_code]:
        symbol = str(stock["symbol"])
        name = str(stock["name"])
        if normalized_query in symbol.lower() or normalized_query in name.lower():
            matches.append(
                StockSearchResult(
                    symbol=symbol,
                    name=name,
                    exchange=exchange_code,
                    sector=str(stock["sector"]),
                    currency=str(currency),
                )
            )

    return matches


def resolve_stock(exchange: str, query: str) -> dict[str, object]:
    exchange_code = exchange.upper()
    if exchange_code not in STOCK_CATALOG:
        raise ValueError(f"Unsupported exchange '{exchange}'.")

    normalized_query = query.strip().lower()
    if not normalized_query:
        raise ValueError("query cannot be empty.")

    catalog = STOCK_CATALOG[exchange_code]
    for stock in catalog:
        if normalized_query == str(stock["symbol"]).lower():
            return stock
    for stock in catalog:
        if normalized_query == str(stock["name"]).lower():
            return stock
    for stock in catalog:
        if normalized_query in str(stock["symbol"]).lower() or normalized_query in str(stock["name"]).lower():
            return stock

    raise LookupError(f"Could not find '{query}' in {exchange_code}.")


def build_price_history(stock: dict[str, object], start_date: date, end_date: date) -> list[dict[str, object]]:
    history: list[dict[str, object]] = []
    business_days = iter_business_days(start_date, end_date)
    base_price = float(stock["base_price"])
    drift = float(stock["drift"])
    volatility = float(stock["volatility"])
    base_volume = int(stock["base_volume"])

    previous_close = base_price
    symbol_bias = (len(str(stock["symbol"])) % 7) / 100

    for index, day in enumerate(business_days):
        wave = math.sin((day.toordinal() % 23) / 3) * volatility
        pulse = math.cos(index / 4) * (volatility / 2)
        trend = 1 + (drift * index)
        close = round(base_price * trend * (1 + wave + pulse + symbol_bias), 2)
        open_price = round(((previous_close * 0.65) + (close * 0.35)), 2)
        high = round(max(open_price, close) * (1 + (volatility * 0.75)), 2)
        low = round(min(open_price, close) * (1 - (volatility * 0.75)), 2)
        volume = int(base_volume * (1 + abs(math.sin(index / 3)) * 0.4))

        history.append(
            {
                "date": day,
                "open": open_price,
                "high": high,
                "low": low,
                "close": close,
                "volume": volume,
            }
        )
        previous_close = close

    return history


def get_corporate_actions(symbol: str, start_date: date, end_date: date) -> list[CorporateAction]:
    events = CORPORATE_ACTIONS.get(symbol, [])
    return [
        CorporateAction(
            action_date=event["action_date"],
            action_type=str(event["action_type"]),
            description=str(event["description"]),
        )
        for event in events
        if start_date <= event["action_date"] <= end_date
    ]
