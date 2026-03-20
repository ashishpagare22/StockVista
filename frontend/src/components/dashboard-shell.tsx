"use client";

import { startTransition, useEffect, useState } from "react";

import { AnalysisSections } from "@/features/analysis/analysis-sections";
import { MarketTabs } from "@/features/markets/market-tabs";
import { AnalysisForm } from "@/features/search/analysis-form";
import { getAnalysis, getRefreshStatus, triggerCatalogRefresh, triggerSymbolRefresh } from "@/services/api";
import { buildMockAnalysis } from "@/services/mock-data";
import { AnalysisFormValues, AnalysisResponse, MarketCode, RefreshStatusResponse } from "@/services/types";

const DEFAULT_MARKET: MarketCode = "NSE";
const LOCAL_DATA_NOTE =
  "StockVista now uses a local database with on-demand historical caching. Full NSE and BSE search expands after you import symbol files into the backend imports folder.";
const DEFAULT_FORM: AnalysisFormValues = {
  query: "Reliance",
  startDate: "2026-01-02",
  endDate: "2026-03-13"
};

export function DashboardShell() {
  const [market, setMarket] = useState<MarketCode>(DEFAULT_MARKET);
  const [formValues, setFormValues] = useState<AnalysisFormValues>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [source, setSource] = useState<"api" | "mock">("mock");
  const [statusMessage, setStatusMessage] = useState(LOCAL_DATA_NOTE);
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshStatus, setRefreshStatus] = useState<RefreshStatusResponse | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResponse>(() =>
    buildMockAnalysis(DEFAULT_MARKET, DEFAULT_FORM.query, DEFAULT_FORM.startDate, DEFAULT_FORM.endDate)
  );

  useEffect(() => {
    void loadRefreshStatus();
  }, []);

  async function loadRefreshStatus(preserveStatusMessage = false) {
    const status = await getRefreshStatus();
    if (status) {
      setRefreshStatus(status);
      if (!preserveStatusMessage) {
        setStatusMessage(
          `Local database ready in ${status.refresh_mode} mode. ${
            status.expected_imports.some((item) => !item.present)
              ? "Some market import files are still missing."
              : "Catalog import files are in place."
          }`
        );
      }
    }
  }

  async function runAnalysis() {
    setLoading(true);
    setErrorMessage("");

    try {
      const next = await getAnalysis(market, formValues.query, formValues.startDate, formValues.endDate);
      startTransition(() => {
        setAnalysis(next.data);
        setSource(next.source);
        setStatusMessage(
          next.source === "api"
            ? "API connected. Historical data is being served from the local StockVista cache."
            : `Preview mode is active. ${LOCAL_DATA_NOTE}`
        );
      });
      await loadRefreshStatus(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to analyze the selected stock.";
      startTransition(() => {
        setErrorMessage(message);
        setStatusMessage(message);
      });
    } finally {
      setLoading(false);
    }
  }

  function handleMarketChange(nextMarket: MarketCode) {
    setMarket(nextMarket);
    setErrorMessage("");
    setStatusMessage(LOCAL_DATA_NOTE);
  }

  async function handleCatalogRefresh() {
    setRefreshing(true);
    setErrorMessage("");
    try {
      const result = await triggerCatalogRefresh(true);
      setStatusMessage(result.message);
      await loadRefreshStatus(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to refresh the local catalog.";
      setErrorMessage(message);
      setStatusMessage(message);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleCurrentSymbolRefresh() {
    if (!formValues.query.trim()) {
      return;
    }

    setRefreshing(true);
    setErrorMessage("");
    try {
      const result = await triggerSymbolRefresh(market, formValues.query);
      setStatusMessage(result.message);
      await loadRefreshStatus(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to refresh the selected stock.";
      setErrorMessage(message);
      setStatusMessage(message);
    } finally {
      setRefreshing(false);
    }
  }

  const activeMarketStatus = refreshStatus?.markets.find((item) => item.code === market);
  const missingImports =
    refreshStatus?.expected_imports.filter((item) => item.exchange === market && !item.present) ?? [];

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
        errorMessage={errorMessage}
        onChange={setFormValues}
        onSubmit={runAnalysis}
      />

      <section className="refresh-panel">
        <div className="refresh-panel__header">
          <div>
            <p className="section-card__eyebrow">Local Data</p>
            <h2 className="refresh-panel__title">{market} catalog and cache status</h2>
          </div>
          <div className="refresh-panel__actions">
            <button
              type="button"
              className="secondary-button"
              onClick={handleCatalogRefresh}
              disabled={refreshing}
            >
              {refreshing ? "Refreshing..." : "Refresh catalogs"}
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={handleCurrentSymbolRefresh}
              disabled={refreshing || !formValues.query.trim()}
            >
              Refresh current stock
            </button>
          </div>
        </div>

        <div className="mini-stat-grid">
          <div className="mini-stat">
            <span>Universe size</span>
            <strong>{activeMarketStatus?.instrument_count ?? 0}</strong>
          </div>
          <div className="mini-stat">
            <span>Cached symbols</span>
            <strong>{activeMarketStatus?.cached_symbol_count ?? 0}</strong>
          </div>
          <div className="mini-stat">
            <span>Latest cached day</span>
            <strong>{activeMarketStatus?.latest_cached_date ?? "Not cached yet"}</strong>
          </div>
          <div className="mini-stat">
            <span>Refresh mode</span>
            <strong>{refreshStatus?.refresh_mode ?? "Unavailable"}</strong>
          </div>
        </div>

        <p className="refresh-panel__note">
          Local history is fetched and saved on demand. That means the symbol master can be large, while price data
          grows only for the stocks you actually analyze.
        </p>

        {missingImports.length ? (
          <p className="refresh-panel__note refresh-panel__note--warning">
            Missing import file for {market}: {missingImports.map((item) => item.path).join(", ")}
          </p>
        ) : null}
      </section>

      <AnalysisSections analysis={analysis} source={source} />
    </main>
  );
}
