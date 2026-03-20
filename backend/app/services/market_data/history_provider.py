from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
import math

import yfinance as yf


@dataclass(frozen=True)
class PriceBar:
    trade_date: date
    open: float
    high: float
    low: float
    close: float
    adj_close: float
    volume: int


@dataclass(frozen=True)
class ActionEvent:
    action_date: date
    action_type: str
    description: str


def _to_number(value: object, fallback: float = 0.0) -> float:
    if value is None:
        return fallback
    try:
        number = float(value)
    except (TypeError, ValueError):
        return fallback
    if math.isnan(number):
        return fallback
    return number


def fetch_history_from_yahoo(yahoo_symbol: str, start_date: date, end_date: date) -> tuple[list[PriceBar], list[ActionEvent]]:
    ticker = yf.Ticker(yahoo_symbol)
    frame = ticker.history(
        start=start_date.isoformat(),
        end=(end_date + timedelta(days=1)).isoformat(),
        interval="1d",
        auto_adjust=False,
        actions=True,
    )

    if frame.empty:
        return [], []

    frame = frame.reset_index()
    prices: list[PriceBar] = []
    actions: list[ActionEvent] = []

    for _, row in frame.iterrows():
        raw_date = row.get("Date")
        trade_date = raw_date.date() if hasattr(raw_date, "date") else date.fromisoformat(str(raw_date)[:10])
        close_value = _to_number(row.get("Close"))
        if close_value <= 0:
            continue

        prices.append(
            PriceBar(
                trade_date=trade_date,
                open=_to_number(row.get("Open"), close_value),
                high=_to_number(row.get("High"), close_value),
                low=_to_number(row.get("Low"), close_value),
                close=close_value,
                adj_close=_to_number(row.get("Adj Close"), close_value),
                volume=int(_to_number(row.get("Volume"), 0.0)),
            )
        )

        dividend_value = _to_number(row.get("Dividends"), 0.0)
        split_value = _to_number(row.get("Stock Splits"), 0.0)
        if dividend_value > 0:
            actions.append(
                ActionEvent(
                    action_date=trade_date,
                    action_type="Dividend",
                    description=f"Dividend payout of {dividend_value:g}",
                )
            )
        if split_value > 0:
            actions.append(
                ActionEvent(
                    action_date=trade_date,
                    action_type="Split",
                    description=f"Stock split ratio {split_value:g}",
                )
            )

    return prices, actions
