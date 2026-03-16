from datetime import date

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
