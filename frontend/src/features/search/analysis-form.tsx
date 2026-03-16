import { AnalysisFormValues, MarketCode } from "@/services/types";

type AnalysisFormProps = {
  market: MarketCode;
  values: AnalysisFormValues;
  loading: boolean;
  onChange: (nextValues: AnalysisFormValues) => void;
  onSubmit: () => void;
};

const EXAMPLES: Record<MarketCode, string[]> = {
  BSE: ["TCS", "HDFCBANK", "SBIN"],
  NSE: ["Reliance", "INFY", "TATAMOTORS"],
  NASDAQ: ["AAPL", "MSFT", "NVDA"]
};

export function AnalysisForm({ market, values, loading, onChange, onSubmit }: AnalysisFormProps) {
  return (
    <div className="form-shell">
      <div className="form-shell__intro">
        <p className="form-shell__label">Analysis inputs</p>
        <h2>Search by stock name or ticker, then pick a date range.</h2>
      </div>

      <div className="input-grid">
        <label className="field">
          <span>Stock</span>
          <input
            type="text"
            value={values.query}
            placeholder={`Try ${EXAMPLES[market][0]}`}
            onChange={(event) => onChange({ ...values, query: event.target.value })}
          />
        </label>

        <label className="field">
          <span>Start date</span>
          <input
            type="date"
            value={values.startDate}
            onChange={(event) => onChange({ ...values, startDate: event.target.value })}
          />
        </label>

        <label className="field">
          <span>End date</span>
          <input
            type="date"
            value={values.endDate}
            onChange={(event) => onChange({ ...values, endDate: event.target.value })}
          />
        </label>

        <button
          type="button"
          className="primary-button"
          onClick={onSubmit}
          disabled={loading || !values.query || !values.startDate || !values.endDate}
        >
          {loading ? "Analyzing..." : "Run analysis"}
        </button>
      </div>

      <div className="example-row">
        <span>Sample inputs:</span>
        {EXAMPLES[market].map((example) => (
          <button
            key={example}
            type="button"
            className="ghost-pill"
            onClick={() => onChange({ ...values, query: example })}
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
