import { AnalysisResponse, MarketCode } from "@/services/types";
import { buildMockAnalysis } from "@/services/mock-data";

type AnalysisResult = {
  data: AnalysisResponse;
  source: "api" | "mock";
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

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

  try {
    const response = await fetch(`${API_BASE_URL}/analysis?${params.toString()}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = (await response.json()) as AnalysisResponse;
    return { data, source: "api" };
  } catch {
    return {
      data: buildMockAnalysis(market, query, startDate, endDate),
      source: "mock"
    };
  }
}
