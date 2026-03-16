import { SectionCard } from "@/components/section-card";
import { StatChip } from "@/components/stat-chip";
import { AnalysisResponse, SeriesPoint } from "@/services/types";

type AnalysisSectionsProps = {
  analysis: AnalysisResponse;
  source: "api" | "mock";
};

function formatCurrency(currency: string, value: number) {
  try {
    return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function buildPolyline(
  series: SeriesPoint[],
  width: number,
  height: number,
  padding: number,
  min: number,
  max: number
) {
  if (!series.length) {
    return "";
  }

  const spread = max - min || 1;

    return series
        .map((point, index) => {
            const x = padding + (index / Math.max(series.length - 1, 1)) * (width - padding * 2);
            const normalized = (point.value - min) / spread;
            const y = height - padding - normalized * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");
}

function toneForReturn(value: number): "positive" | "negative" | "neutral" {
  if (value > 0) {
    return "positive";
  }
  if (value < 0) {
    return "negative";
  }
    return "neutral";
}

function rebaseSeries(series: SeriesPoint[]): SeriesPoint[] {
  if (!series.length || series[0]?.value === 0) {
    return series;
  }

  const base = series[0].value;
  return series.map((point) => ({
    date: point.date,
    value: Number(((point.value / base) * 100).toFixed(2))
  }));
}

export function AnalysisSections({ analysis, source }: AnalysisSectionsProps) {
  const width = 760;
  const height = 260;
  const padding = 24;
  const rebasedStockSeries = rebaseSeries(analysis.series);
  const rebasedBenchmarkSeries = rebaseSeries(analysis.benchmark_series);
  const chartValues = [...rebasedStockSeries, ...rebasedBenchmarkSeries].map((point) => point.value);
  const chartMin = Math.min(...chartValues);
  const chartMax = Math.max(...chartValues);
  const stockLine = buildPolyline(rebasedStockSeries, width, height, padding, chartMin, chartMax);
  const benchmarkLine = buildPolyline(rebasedBenchmarkSeries, width, height, padding, chartMin, chartMax);

  return (
    <div className="analysis-layout">
      <div className="hero-panel">
        <div>
          <p className="hero-panel__eyebrow">
            {analysis.market.code} analysis {source === "mock" ? "preview" : "live API"}
          </p>
          <h2>
            {analysis.overview.company_name} <span>{analysis.overview.symbol}</span>
          </h2>
          <p className="hero-panel__summary">{analysis.summary}</p>
        </div>

        <div className="hero-panel__chips">
          <StatChip
            label="Range return"
            value={`${analysis.returns.percent_return.toFixed(2)}%`}
            tone={toneForReturn(analysis.returns.percent_return)}
          />
          <StatChip
            label="Vs benchmark"
            value={`${analysis.benchmark.relative_performance.toFixed(2)}%`}
            tone={toneForReturn(analysis.benchmark.relative_performance)}
          />
          <StatChip
            label="Volatility"
            value={`${analysis.returns.annualized_volatility.toFixed(2)}%`}
          />
        </div>
      </div>

      <div className="section-grid section-grid--compact">
        <SectionCard title="Overview" subtitle="Company profile">
          <div className="key-value-grid">
            <div>
              <span>Exchange</span>
              <strong>{analysis.overview.exchange}</strong>
            </div>
            <div>
              <span>Sector</span>
              <strong>{analysis.overview.sector}</strong>
            </div>
            <div>
              <span>Currency</span>
              <strong>{analysis.overview.currency}</strong>
            </div>
            <div>
              <span>Date range</span>
              <strong>
                {analysis.input.start_date} to {analysis.input.end_date}
              </strong>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Snapshot" subtitle={`As of ${analysis.price_snapshot.as_of}`}>
          <div className="key-value-grid">
            <div>
              <span>Open</span>
              <strong>{formatCurrency(analysis.overview.currency, analysis.price_snapshot.open)}</strong>
            </div>
            <div>
              <span>High</span>
              <strong>{formatCurrency(analysis.overview.currency, analysis.price_snapshot.high)}</strong>
            </div>
            <div>
              <span>Low</span>
              <strong>{formatCurrency(analysis.overview.currency, analysis.price_snapshot.low)}</strong>
            </div>
            <div>
              <span>Close</span>
              <strong>{formatCurrency(analysis.overview.currency, analysis.price_snapshot.close)}</strong>
            </div>
            <div>
              <span>Volume</span>
              <strong>{analysis.price_snapshot.volume.toLocaleString()}</strong>
            </div>
            <div>
              <span>Daily move</span>
              <strong>{analysis.price_snapshot.day_change_percent.toFixed(2)}%</strong>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Chart" subtitle="Stock vs benchmark">
        <div className="chart-shell">
          <svg viewBox={`0 0 ${width} ${height}`} className="trend-chart" role="img" aria-label="Stock performance chart">
            <rect x="0" y="0" width={width} height={height} rx="18" className="chart-background" />
            <polyline points={benchmarkLine} className="chart-line chart-line--benchmark" />
            <polyline points={stockLine} className="chart-line chart-line--stock" />
          </svg>
          <div className="chart-legend">
            <span className="chart-legend__item">
              <i className="chart-legend__swatch chart-legend__swatch--stock" />
              Stock
            </span>
            <span className="chart-legend__item">
              <i className="chart-legend__swatch chart-legend__swatch--benchmark" />
              {analysis.benchmark.benchmark_name}
            </span>
          </div>
        </div>
      </SectionCard>

      <div className="section-grid">
        <SectionCard title="Performance" subtitle="Range-based metrics">
          <div className="chip-grid">
            <StatChip
              label="Absolute return"
              value={formatCurrency(analysis.overview.currency, analysis.returns.absolute_return)}
              tone={toneForReturn(analysis.returns.absolute_return)}
            />
            <StatChip
              label="Percent return"
              value={`${analysis.returns.percent_return.toFixed(2)}%`}
              tone={toneForReturn(analysis.returns.percent_return)}
            />
            <StatChip label="Volatility" value={`${analysis.returns.annualized_volatility.toFixed(2)}%`} />
            <StatChip
              label="Max drawdown"
              value={`${analysis.returns.max_drawdown.toFixed(2)}%`}
              tone={toneForReturn(analysis.returns.max_drawdown)}
            />
          </div>
        </SectionCard>

        <SectionCard title="Technicals" subtitle="Quick signal pack">
          <div className="chip-grid">
            <StatChip label="20 DMA" value={formatCurrency(analysis.overview.currency, analysis.technicals.moving_average_20)} />
            <StatChip label="50 DMA" value={formatCurrency(analysis.overview.currency, analysis.technicals.moving_average_50)} />
            <StatChip label="RSI 14" value={analysis.technicals.rsi_14.toFixed(2)} />
          </div>
        </SectionCard>
      </div>

      <div className="section-grid">
        <SectionCard title="Benchmark" subtitle="Relative market view">
          <div className="chip-grid">
            <StatChip label={analysis.benchmark.benchmark_name} value={`${analysis.benchmark.benchmark_return.toFixed(2)}%`} />
            <StatChip
              label="Relative performance"
              value={`${analysis.benchmark.relative_performance.toFixed(2)}%`}
              tone={toneForReturn(analysis.benchmark.relative_performance)}
            />
          </div>
        </SectionCard>

        <SectionCard title="Corporate Actions" subtitle="Events in range">
          {analysis.corporate_actions.length ? (
            <div className="action-list">
              {analysis.corporate_actions.map((action) => (
                <div key={`${action.action_date}-${action.action_type}`} className="action-item">
                  <strong>{action.action_type}</strong>
                  <span>{action.action_date}</span>
                  <p>{action.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted-copy">No corporate actions were found for the selected date range.</p>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
