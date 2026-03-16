export type MarketCode = "BSE" | "NSE" | "NASDAQ";

export type MarketDescriptor = {
  code: MarketCode;
  benchmark: string;
  currency: string;
  timezone: string;
};

export type QueryWindow = {
  query: string;
  start_date: string;
  end_date: string;
};

export type PriceSnapshot = {
  as_of: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  day_change_percent: number;
};

export type ReturnMetrics = {
  absolute_return: number;
  percent_return: number;
  annualized_volatility: number;
  max_drawdown: number;
};

export type TechnicalSnapshot = {
  moving_average_20: number;
  moving_average_50: number;
  rsi_14: number;
};

export type BenchmarkComparison = {
  benchmark_name: string;
  benchmark_return: number;
  relative_performance: number;
};

export type CorporateAction = {
  action_date: string;
  action_type: string;
  description: string;
};

export type SeriesPoint = {
  date: string;
  value: number;
};

export type StockOverview = {
  symbol: string;
  company_name: string;
  exchange: MarketCode;
  sector: string;
  currency: string;
};

export type AnalysisResponse = {
  market: MarketDescriptor;
  overview: StockOverview;
  input: QueryWindow;
  price_snapshot: PriceSnapshot;
  returns: ReturnMetrics;
  technicals: TechnicalSnapshot;
  benchmark: BenchmarkComparison;
  corporate_actions: CorporateAction[];
  series: SeriesPoint[];
  benchmark_series: SeriesPoint[];
  summary: string;
};

export type AnalysisFormValues = {
  query: string;
  startDate: string;
  endDate: string;
};
