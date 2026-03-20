"use client";

import { useEffect, useState } from "react";

import { searchStocks } from "@/services/api";
import { AnalysisFormValues, MarketCode, StockSearchResult } from "@/services/types";

type AnalysisFormProps = {
  market: MarketCode;
  values: AnalysisFormValues;
  loading: boolean;
  errorMessage?: string;
  onChange: (nextValues: AnalysisFormValues) => void;
  onSubmit: () => void;
};

const EXAMPLES: Record<MarketCode, string[]> = {
  BSE: ["TCS", "HDFCBANK", "SBIN"],
  NSE: ["Reliance", "INFY", "TATAMOTORS"],
  NASDAQ: ["AAPL", "MSFT", "NVDA"]
};

export function AnalysisForm({ market, values, loading, errorMessage, onChange, onSubmit }: AnalysisFormProps) {
  const [suggestions, setSuggestions] = useState<StockSearchResult[]>([]);

  useEffect(() => {
    let active = true;
    if (values.query.trim().length < 2) {
      setSuggestions([]);
      return () => {
        active = false;
      };
    }

    const timer = window.setTimeout(async () => {
      const results = await searchStocks(market, values.query);
      if (active) {
        setSuggestions(results);
      }
    }, 220);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [market, values.query]);

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
            list={`stock-suggestions-${market}`}
            placeholder={`Try ${EXAMPLES[market][0]}`}
            onChange={(event) => onChange({ ...values, query: event.target.value })}
          />
          <datalist id={`stock-suggestions-${market}`}>
            {suggestions.map((suggestion) => (
              <option
                key={`${suggestion.exchange}-${suggestion.symbol}`}
                value={suggestion.symbol}
              >{`${suggestion.name} (${suggestion.symbol})`}</option>
            ))}
          </datalist>
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

      {suggestions.length ? (
        <div className="suggestion-strip">
          {suggestions.slice(0, 6).map((suggestion) => (
            <button
              key={`${suggestion.exchange}-${suggestion.symbol}-chip`}
              type="button"
              className="suggestion-pill"
              onClick={() => onChange({ ...values, query: suggestion.symbol })}
            >
              <strong>{suggestion.symbol}</strong>
              <span>{suggestion.name}</span>
            </button>
          ))}
        </div>
      ) : null}

      <p className="form-shell__note">
        Search suggestions come from your local database. Full NSE and BSE coverage appears after you import symbol
        files into the backend imports folder.
      </p>

      {errorMessage ? <p className="error-callout">{errorMessage}</p> : null}
    </div>
  );
}
