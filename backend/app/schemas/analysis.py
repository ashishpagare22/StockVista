from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, Field


class MarketDescriptor(BaseModel):
    code: str
    benchmark: str
    currency: str
    timezone: str


class StockSearchResult(BaseModel):
    symbol: str
    name: str
    exchange: str
    sector: str
    currency: str


class QueryWindow(BaseModel):
    query: str
    start_date: date
    end_date: date


class PriceSnapshot(BaseModel):
    as_of: date
    open: float
    high: float
    low: float
    close: float
    volume: int
    day_change_percent: float


class ReturnMetrics(BaseModel):
    absolute_return: float
    percent_return: float
    annualized_volatility: float
    max_drawdown: float


class TechnicalSnapshot(BaseModel):
    moving_average_20: float
    moving_average_50: float
    rsi_14: float


class BenchmarkComparison(BaseModel):
    benchmark_name: str
    benchmark_return: float
    relative_performance: float


class CorporateAction(BaseModel):
    action_date: date
    action_type: str
    description: str


class SeriesPoint(BaseModel):
    date: date
    value: float = Field(..., description="Closing value for the series point.")


class StockOverview(BaseModel):
    symbol: str
    company_name: str
    exchange: str
    sector: str
    currency: str


class AnalysisResponse(BaseModel):
    market: MarketDescriptor
    overview: StockOverview
    input: QueryWindow
    price_snapshot: PriceSnapshot
    returns: ReturnMetrics
    technicals: TechnicalSnapshot
    benchmark: BenchmarkComparison
    corporate_actions: list[CorporateAction]
    series: list[SeriesPoint]
    benchmark_series: list[SeriesPoint]
    summary: str


class ImportFileStatus(BaseModel):
    exchange: str
    path: str
    description: str
    present: bool


class MarketSyncStatus(BaseModel):
    code: str
    benchmark: str
    currency: str
    timezone: str
    instrument_count: int
    benchmark_count: int
    cached_symbol_count: int
    earliest_cached_date: date | None
    latest_cached_date: date | None
    last_sync_status: str | None
    last_sync_completed_at: datetime | None
    last_sync_message: str | None


class RefreshStatusResponse(BaseModel):
    database_path: str
    imports_path: str
    refresh_mode: str
    auto_refresh_on_startup: bool
    default_history_days: int
    expected_imports: list[ImportFileStatus]
    markets: list[MarketSyncStatus]


class RefreshRunResponse(BaseModel):
    message: str
    exchange: str | None = None
    query: str | None = None
    days_back: int | None = None
    details: dict[str, Any] = Field(default_factory=dict)
