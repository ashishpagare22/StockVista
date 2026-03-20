import {
  AnalysisResponse,
  MarketCode,
  RefreshRunResponse,
  RefreshStatusResponse,
  StockSearchResult
} from "@/services/types";
import { buildMockAnalysis } from "@/services/mock-data";

type AnalysisResult = {
  data: AnalysisResponse;
  source: "api" | "mock";
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

async function parseError(response: Response): Promise<string> {
  const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
  return payload?.detail ?? `API request failed with status ${response.status}`;
}

export async function getAnalysis(
  market: MarketCode,
  query: string,
  startDate: string,
  endDate: string
): Promise<AnalysisResult> {
  const params = new URLSearchParams({
    exchange: market,
    query,
    start_date: startDate,
    end_date: endDate
  });

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/analysis?${params.toString()}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store"
    });
  } catch {
    return {
      data: buildMockAnalysis(market, query, startDate, endDate),
      source: "mock"
    };
  }

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const data = (await response.json()) as AnalysisResponse;
  return { data, source: "api" };
}

export async function searchStocks(market: MarketCode, query: string): Promise<StockSearchResult[]> {
  if (query.trim().length < 2) {
    return [];
  }

  const params = new URLSearchParams({ exchange: market, query });
  try {
    const response = await fetch(`${API_BASE_URL}/stocks/search?${params.toString()}`, {
      method: "GET",
      cache: "no-store"
    });
    if (!response.ok) {
      return [];
    }
    return (await response.json()) as StockSearchResult[];
  } catch {
    return [];
  }
}

export async function getRefreshStatus(): Promise<RefreshStatusResponse | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/refresh/status`, {
      method: "GET",
      cache: "no-store"
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as RefreshStatusResponse;
  } catch {
    return null;
  }
}

export async function triggerCatalogRefresh(includeNasdaq = true): Promise<RefreshRunResponse> {
  const params = new URLSearchParams({ include_nasdaq: String(includeNasdaq) });
  const response = await fetch(`${API_BASE_URL}/refresh/catalogs?${params.toString()}`, {
    method: "POST",
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return (await response.json()) as RefreshRunResponse;
}

export async function triggerSymbolRefresh(
  market: MarketCode,
  query: string,
  daysBack?: number
): Promise<RefreshRunResponse> {
  const params = new URLSearchParams({
    exchange: market,
    query
  });
  if (daysBack) {
    params.set("days_back", String(daysBack));
  }

  const response = await fetch(`${API_BASE_URL}/refresh/history?${params.toString()}`, {
    method: "POST",
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return (await response.json()) as RefreshRunResponse;
}
