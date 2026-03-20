import { AnalysisResponse, MarketCode } from "@/services/types";

type StockSeed = {
  symbol: string;
  name: string;
  sector: string;
  basePrice: number;
  drift: number;
  volatility: number;
  volume: number;
};

const MARKET_META = {
  BSE: { benchmark: "Sensex", currency: "INR", timezone: "Asia/Kolkata", baseBenchmark: 73500, benchmarkDrift: 0.00035 },
  NSE: { benchmark: "Nifty 50", currency: "INR", timezone: "Asia/Kolkata", baseBenchmark: 22250, benchmarkDrift: 0.00042 },
  NASDAQ: { benchmark: "Nasdaq Composite", currency: "USD", timezone: "America/New_York", baseBenchmark: 18300, benchmarkDrift: 0.00055 }
} as const;

const STOCKS: Record<MarketCode, StockSeed[]> = {
  BSE: [
    { symbol: "TCS", name: "Tata Consultancy Services", sector: "Information Technology", basePrice: 4060, drift: 0.00045, volatility: 0.015, volume: 1350000 },
    { symbol: "HDFCBANK", name: "HDFC Bank", sector: "Financial Services", basePrice: 1675, drift: 0.00034, volatility: 0.013, volume: 1840000 },
    { symbol: "SBIN", name: "State Bank of India", sector: "Banking", basePrice: 815, drift: 0.0005, volatility: 0.019, volume: 3150000 }
  ],
  NSE: [
    { symbol: "RELIANCE", name: "Reliance Industries", sector: "Energy", basePrice: 2920, drift: 0.00058, volatility: 0.017, volume: 4100000 },
    { symbol: "INFY", name: "Infosys", sector: "Information Technology", basePrice: 1635, drift: 0.00044, volatility: 0.016, volume: 2800000 },
    { symbol: "TATAMOTORS", name: "Tata Motors", sector: "Automobile", basePrice: 1045, drift: 0.00063, volatility: 0.022, volume: 5200000 }
  ],
  NASDAQ: [
    { symbol: "AAPL", name: "Apple Inc.", sector: "Consumer Electronics", basePrice: 224, drift: 0.00072, volatility: 0.014, volume: 65000000 },
    { symbol: "MSFT", name: "Microsoft Corporation", sector: "Software", basePrice: 428, drift: 0.00068, volatility: 0.013, volume: 29000000 },
    { symbol: "NVDA", name: "NVIDIA Corporation", sector: "Semiconductors", basePrice: 876, drift: 0.00095, volatility: 0.026, volume: 51500000 }
  ]
};

const CORPORATE_ACTIONS: Record<string, { action_date: string; action_type: string; description: string }[]> = {
  RELIANCE: [{ action_date: "2026-01-15", action_type: "Dividend", description: "Illustrative interim dividend in seeded data" }],
  INFY: [{ action_date: "2026-02-02", action_type: "Buyback", description: "Illustrative board review in seeded data" }],
  AAPL: [{ action_date: "2026-02-06", action_type: "Dividend", description: "Illustrative quarterly payout in seeded data" }],
  NVDA: [{ action_date: "2026-01-27", action_type: "Split", description: "Illustrative split event in seeded data" }]
};

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function businessDays(startDate: string, endDate: string): string[] {
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    const days: string[] = [];

  const cursor = new Date(start);
    while (cursor <= end) {
        const day = cursor.getDay();
        if (day !== 0 && day !== 6) {
            days.push(toIsoDate(cursor));
        }
        cursor.setDate(cursor.getDate() + 1);
    }

    if (!days.length) {
        const fallback = new Date(end);
        while (fallback.getDay() === 0 || fallback.getDay() === 6) {
            fallback.setDate(fallback.getDate() - 1);
        }
        days.push(toIsoDate(fallback));
    }

    return days;
}

function average(values: number[]): number {
  if (!values.length) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function rsi(values: number[]): number {
  if (values.length < 2) {
    return 50;
  }

  const deltas = values.slice(1).map((value, index) => value - values[index]);
  const gains = deltas.filter((delta) => delta > 0);
  const losses = deltas.filter((delta) => delta < 0).map((value) => Math.abs(value));
  const avgGain = gains.length ? average(gains) : 0;
  const avgLoss = losses.length ? average(losses) : 0;

  if (!avgLoss) {
    return avgGain ? 100 : 50;
  }

  const strength = avgGain / avgLoss;
  return Number((100 - 100 / (1 + strength)).toFixed(2));
}

function stdDev(values: number[]): number {
  if (values.length < 2) {
    return 0;
  }

  const mean = average(values);
  const variance = average(values.map((value) => (value - mean) ** 2));
  return Math.sqrt(variance);
}

function resolveStock(market: MarketCode, query: string): StockSeed {
  const normalized = query.trim().toLowerCase();
  const pool = STOCKS[market];
  const match = (
    pool.find((stock) => stock.symbol.toLowerCase() === normalized) ||
    pool.find((stock) => stock.name.toLowerCase() === normalized) ||
    pool.find((stock) => stock.symbol.toLowerCase().includes(normalized) || stock.name.toLowerCase().includes(normalized))
  );

  if (!match) {
    const supported = pool.map((stock) => stock.symbol).join(", ");
    throw new Error(`Current demo data supports only these ${market} stocks: ${supported}.`);
  }

  return match;
}

function buildSeries(basePrice: number, drift: number, volatility: number, dates: string[]) {
  return dates.map((day, index) => {
    const dayNumber = Number(day.slice(-2));
    const wave = Math.sin((dayNumber + index) / 3) * volatility;
    const pulse = Math.cos(index / 4) * (volatility / 2);
    const value = Number((basePrice * (1 + drift * index) * (1 + wave + pulse)).toFixed(2));
    return { date: day, value };
  });
}

function buildSummary(percentReturn: number, volatility: number, relativePerformance: number): string {
  const direction =
    percentReturn >= 12
      ? "a strong upward trend"
      : percentReturn >= 3
        ? "a steady positive trend"
        : percentReturn <= -12
          ? "a sharp pullback"
          : percentReturn <= -3
            ? "a mild downtrend"
            : "a range-bound profile";

  const risk =
    volatility >= 30 ? "elevated volatility" : volatility >= 18 ? "moderate volatility" : "contained volatility";

  const benchmarkPhrase =
    relativePerformance >= 3
      ? "outperformed its benchmark"
      : relativePerformance <= -3
        ? "lagged its benchmark"
        : "tracked close to its benchmark";

  return `The stock showed ${direction} over the selected range, with ${risk}, and ${benchmarkPhrase}.`;
}

export function buildMockAnalysis(
  market: MarketCode,
  query: string,
  startDate: string,
  endDate: string
): AnalysisResponse {
  const stock = resolveStock(market, query);
  const marketMeta = MARKET_META[market];
  const dates = businessDays(startDate, endDate);
  const series = buildSeries(stock.basePrice, stock.drift, stock.volatility, dates);
  const benchmarkSeries = buildSeries(
    marketMeta.baseBenchmark,
    marketMeta.benchmarkDrift,
    stock.volatility * 0.55,
    dates
  );

  const closes = series.map((point) => point.value);
  const absoluteReturn = Number((closes.at(-1)! - closes[0]!).toFixed(2));
  const percentReturn = Number(((absoluteReturn / closes[0]!) * 100).toFixed(2));
  const benchmarkReturn = Number(
    (((benchmarkSeries.at(-1)!.value - benchmarkSeries[0]!.value) / benchmarkSeries[0]!.value) * 100).toFixed(2)
  );
  const relativePerformance = Number((percentReturn - benchmarkReturn).toFixed(2));
  const dailyReturns = closes.slice(1).map((close, index) => (close - closes[index]!) / closes[index]!);
  const annualizedVolatility = Number((stdDev(dailyReturns) * Math.sqrt(252) * 100).toFixed(2));
  const runningPeak = closes.reduce<number[]>((peaks, close) => {
    peaks.push(peaks.length ? Math.max(peaks[peaks.length - 1]!, close) : close);
    return peaks;
  }, []);
  const maxDrawdown = Number(
    Math.min(...closes.map((close, index) => ((close - runningPeak[index]!) / runningPeak[index]!) * 100)).toFixed(2)
  );
  const previousClose = closes.length > 1 ? closes[closes.length - 2]! : closes[0]!;
  const lastClose = closes.at(-1)!;
  const stockActions = CORPORATE_ACTIONS[stock.symbol] ?? [];

  return {
    market: {
      code: market,
      benchmark: marketMeta.benchmark,
      currency: marketMeta.currency,
      timezone: marketMeta.timezone
    },
    overview: {
      symbol: stock.symbol,
      company_name: stock.name,
      exchange: market,
      sector: stock.sector,
      currency: marketMeta.currency
    },
    input: {
      query,
      start_date: startDate,
      end_date: endDate
    },
    price_snapshot: {
      as_of: dates.at(-1)!,
      open: Number(((previousClose * 0.65) + (lastClose * 0.35)).toFixed(2)),
      high: Number((lastClose * (1 + stock.volatility * 0.75)).toFixed(2)),
      low: Number((lastClose * (1 - stock.volatility * 0.75)).toFixed(2)),
      close: lastClose,
      volume: Math.round(stock.volume * 1.12),
      day_change_percent: Number((((lastClose - previousClose) / previousClose) * 100).toFixed(2))
    },
    returns: {
      absolute_return: absoluteReturn,
      percent_return: percentReturn,
      annualized_volatility: annualizedVolatility,
      max_drawdown: maxDrawdown
    },
    technicals: {
      moving_average_20: Number(average(closes.slice(-20)).toFixed(2)),
      moving_average_50: Number(average(closes.slice(-50)).toFixed(2)),
      rsi_14: rsi(closes.slice(-15))
    },
    benchmark: {
      benchmark_name: marketMeta.benchmark,
      benchmark_return: benchmarkReturn,
      relative_performance: relativePerformance
    },
    corporate_actions: stockActions.filter(
      (action) => action.action_date >= startDate && action.action_date <= endDate
    ),
    series,
    benchmark_series: benchmarkSeries,
    summary: buildSummary(percentReturn, annualizedVolatility, relativePerformance)
  };
}
