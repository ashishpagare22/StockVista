import { MarketCode } from "@/services/types";

type MarketTabsProps = {
  activeMarket: MarketCode;
  onChange: (market: MarketCode) => void;
};

const MARKETS: { code: MarketCode; label: string; description: string }[] = [
  { code: "BSE", label: "BSE", description: "India large-cap bellwethers" },
  { code: "NSE", label: "NSE", description: "India benchmark and growth names" },
  { code: "NASDAQ", label: "NASDAQ", description: "US technology and momentum leaders" }
];

export function MarketTabs({ activeMarket, onChange }: MarketTabsProps) {
  return (
    <div className="market-tabs" role="tablist" aria-label="Markets">
      {MARKETS.map((market) => (
        <button
          key={market.code}
          type="button"
          className={`market-tab ${activeMarket === market.code ? "market-tab--active" : ""}`}
          onClick={() => onChange(market.code)}
        >
          <span>{market.label}</span>
          <small>{market.description}</small>
        </button>
      ))}
    </div>
  );
}
