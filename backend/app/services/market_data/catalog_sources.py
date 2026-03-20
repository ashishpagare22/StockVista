from __future__ import annotations

import csv
from dataclasses import dataclass
import json
from pathlib import Path
from urllib import request

from app.core.config import settings
from app.services.benchmarks.catalog import MARKET_METADATA
from app.services.market_data.mock_provider import STOCK_CATALOG


SEC_NASDAQ_CATALOG_URL = "https://www.sec.gov/files/company_tickers_exchange.json"


@dataclass(frozen=True)
class InstrumentSeed:
    exchange: str
    symbol: str
    company_name: str
    sector: str
    currency: str
    yahoo_symbol: str
    instrument_type: str
    source: str
    metadata_json: str = "{}"


def _pick(row: dict[str, str], aliases: list[str]) -> str:
    normalized_row = {key.strip().lower(): value for key, value in row.items() if key is not None}
    for alias in aliases:
        value = normalized_row.get(alias)
        if value:
            return value.strip()
    return ""


def expected_import_files(imports_path: Path) -> list[dict[str, object]]:
    files = [
        {
            "exchange": "NSE",
            "path": str(imports_path / "nse_symbols.csv"),
            "description": "Drop an NSE symbol file here to unlock full NSE search.",
        },
        {
            "exchange": "BSE",
            "path": str(imports_path / "bse_symbols.csv"),
            "description": "Drop a BSE symbol file here to unlock full BSE search.",
        },
        {
            "exchange": "NASDAQ",
            "path": str(imports_path / "nasdaq_symbols.csv"),
            "description": "Optional local Nasdaq override. If absent, StockVista can bootstrap Nasdaq from SEC.",
        },
    ]

    for item in files:
        item["present"] = Path(str(item["path"])).exists()

    return files


def build_benchmark_seeds() -> list[InstrumentSeed]:
    seeds: list[InstrumentSeed] = []
    for exchange, metadata in MARKET_METADATA.items():
        seeds.append(
            InstrumentSeed(
                exchange=exchange,
                symbol=str(metadata["benchmark_symbol"]),
                company_name=str(metadata["benchmark"]),
                sector="Benchmark Index",
                currency=str(metadata["currency"]),
                yahoo_symbol=str(metadata["benchmark_yahoo_symbol"]),
                instrument_type="benchmark",
                source="market_metadata",
                metadata_json=json.dumps({"benchmark": True}),
            )
        )
    return seeds


def build_demo_equity_seeds() -> list[InstrumentSeed]:
    seeds: list[InstrumentSeed] = []
    suffix_map = {"NSE": ".NS", "BSE": ".BO", "NASDAQ": ""}

    for exchange, items in STOCK_CATALOG.items():
        currency = str(MARKET_METADATA[exchange]["currency"])
        suffix = suffix_map[exchange]
        for item in items:
            symbol = str(item["symbol"])
            yahoo_symbol = symbol if not suffix else f"{symbol}{suffix}"
            seeds.append(
                InstrumentSeed(
                    exchange=exchange,
                    symbol=symbol,
                    company_name=str(item["name"]),
                    sector=str(item["sector"]),
                    currency=currency,
                    yahoo_symbol=yahoo_symbol,
                    instrument_type="equity",
                    source="demo_seed",
                    metadata_json=json.dumps({"seeded": True}),
                )
            )
    return seeds


def load_csv_catalogs(imports_path: Path) -> tuple[list[InstrumentSeed], list[str]]:
    seeds: list[InstrumentSeed] = []
    notes: list[str] = []

    files = {
        "NSE": imports_path / "nse_symbols.csv",
        "BSE": imports_path / "bse_symbols.csv",
        "NASDAQ": imports_path / "nasdaq_symbols.csv",
    }

    for exchange, path in files.items():
        if not path.exists():
            notes.append(f"{exchange}: import file not found at {path}")
            continue

        loaded = 0
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                symbol = _pick(
                    row,
                    [
                        "symbol",
                        "ticker",
                        "security id",
                        "security_id",
                        "trading symbol",
                        "trading_symbol",
                        "nse_symbol",
                        "bse_symbol",
                    ],
                )
                company_name = _pick(
                    row,
                    [
                        "company_name",
                        "name",
                        "company",
                        "company name",
                        "security name",
                        "issuer name",
                    ],
                )

                if not symbol or not company_name:
                    continue

                sector = _pick(row, ["sector", "industry", "industry name"]) or "Unclassified"
                currency = _pick(row, ["currency"]) or str(MARKET_METADATA[exchange]["currency"])
                yahoo_symbol = _pick(row, ["yahoo_symbol", "finance_symbol"])
                if not yahoo_symbol:
                    yahoo_symbol = symbol if exchange == "NASDAQ" else f"{symbol}.{'NS' if exchange == 'NSE' else 'BO'}"

                seeds.append(
                    InstrumentSeed(
                        exchange=exchange,
                        symbol=symbol.upper(),
                        company_name=company_name,
                        sector=sector,
                        currency=currency,
                        yahoo_symbol=yahoo_symbol.upper(),
                        instrument_type="equity",
                        source=f"csv_import:{path.name}",
                    )
                )
                loaded += 1

        notes.append(f"{exchange}: loaded {loaded} instruments from {path.name}")

    return seeds, notes


def load_sec_nasdaq_catalog() -> list[InstrumentSeed]:
    request_object = request.Request(
        SEC_NASDAQ_CATALOG_URL,
        headers={"User-Agent": settings.sec_user_agent},
    )
    with request.urlopen(request_object, timeout=30) as response:
        payload = json.loads(response.read().decode("utf-8"))

    fields = [field.strip().lower() for field in payload.get("fields", [])]
    rows = payload.get("data", [])
    field_index = {name: index for index, name in enumerate(fields)}

    seeds: list[InstrumentSeed] = []
    for entry in rows:
        exchange = str(entry[field_index["exchange"]]) if field_index.get("exchange") is not None else ""
        if exchange.lower() != "nasdaq":
            continue

        ticker = str(entry[field_index["ticker"]]).upper()
        name = str(entry[field_index["name"]]).strip()
        cik = str(entry[field_index["cik"]]) if field_index.get("cik") is not None else ""
        if not ticker or not name:
            continue

        seeds.append(
            InstrumentSeed(
                exchange="NASDAQ",
                symbol=ticker,
                company_name=name,
                sector="Unclassified",
                currency="USD",
                yahoo_symbol=ticker,
                instrument_type="equity",
                source="sec_nasdaq",
                metadata_json=json.dumps({"cik": cik}),
            )
        )

    return seeds
