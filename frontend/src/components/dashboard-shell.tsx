"use client";

import { startTransition, useState } from "react";

import { AnalysisSections } from "@/features/analysis/analysis-sections";
import { MarketTabs } from "@/features/markets/market-tabs";
import { AnalysisForm } from "@/features/search/analysis-form";
import { getAnalysis } from "@/services/api";
import { buildMockAnalysis } from "@/services/mock-data";
import { AnalysisFormValues, AnalysisResponse, MarketCode } from "@/services/types";

const DEFAULT_MARKET: MarketCode = "NSE";
const DEFAULT_FORM: AnalysisFormValues = {
  query: "Reliance",
  startDate: "2026-01-02",
  endDate: "2026-03-13"
};

export function DashboardShell() {
  const [market, setMarket] = useState<MarketCode>(DEFAULT_MARKET);
  const [formValues, setFormValues] = useState<AnalysisFormValues>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<"api" | "mock">("mock");
  const [statusMessage, setStatusMessage] = useState("Showing a seeded preview until the API is connected.");
  const [analysis, setAnalysis] = useState<AnalysisResponse>(() =>
    buildMockAnalysis(DEFAULT_MARKET, DEFAULT_FORM.query, DEFAULT_FORM.startDate, DEFAULT_FORM.endDate)
  );

  async function runAnalysis() {
    setLoading(true);
    const next = await getAnalysis(market, formValues.query, formValues.startDate, formValues.endDate);
    startTransition(() => {
      setAnalysis(next.data);
      setSource(next.source);
      setStatusMessage(
        next.source === "api"
          ? "The dashboard is reading from the FastAPI analysis endpoint."
          : "API fallback is active, so the dashboard is showing seeded preview data."
      );
    });
    setLoading(false);
  }

  function handleMarketChange(nextMarket: MarketCode) {
    setMarket(nextMarket);
  }

  return (
    <main className="page-shell">
      <section className="masthead">
        <div className="masthead__copy">
          <p className="eyebrow">StockVista</p>
          <h1>Cross-market stock performance analysis built for fast research.</h1>
          <p className="masthead__lede">
            Compare stocks across BSE, NSE, and NASDAQ using one workflow for search, date-based performance,
            technical signals, and benchmark context.
          </p>
        </div>
        <div className="status-banner">
          <span>Status</span>
          <strong>{statusMessage}</strong>
        </div>
      </section>

      <MarketTabs activeMarket={market} onChange={handleMarketChange} />

      <AnalysisForm
        market={market}
        values={formValues}
        loading={loading}
        onChange={setFormValues}
        onSubmit={runAnalysis}
      />

      <AnalysisSections analysis={analysis} source={source} />
    </main>
  );
}
