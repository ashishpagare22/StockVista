from __future__ import annotations

import csv
from dataclasses import dataclass
from pathlib import Path

from app.services.benchmarks.catalog import MARKET_METADATA


SYMBOL_ALIASES = [
    "symbol",
    "ticker",
    "security id",
    "security_id",
    "trading symbol",
    "trading_symbol",
    "nse_symbol",
    "bse_symbol",
]

COMPANY_NAME_ALIASES = [
    "company_name",
    "name",
    "name of company",
    "company",
    "company name",
    "security name",
    "issuer name",
]

SECTOR_ALIASES = [
    "sector",
    "industry",
    "industry name",
]

YAHOO_SYMBOL_ALIASES = [
    "yahoo_symbol",
    "finance_symbol",
]

CURRENCY_ALIASES = [
    "currency",
]


@dataclass(frozen=True)
class NormalizedRow:
    symbol: str
    company_name: str
    sector: str
    yahoo_symbol: str
    currency: str


def _normalize_header(row: dict[str, str]) -> dict[str, str]:
    return {str(key).strip().lower(): (value or "").strip() for key, value in row.items() if key is not None}


def _pick(row: dict[str, str], aliases: list[str]) -> str:
    for alias in aliases:
        value = row.get(alias)
        if value:
            return value.strip()
    return ""


def _infer_yahoo_symbol(exchange: str, symbol: str) -> str:
    exchange_code = exchange.upper()
    if exchange_code == "NSE":
        return f"{symbol}.NS"
    if exchange_code == "BSE":
        return f"{symbol}.BO"
    return symbol


def _detect_delimiter(sample: str) -> str:
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=",\t;|")
        return dialect.delimiter
    except csv.Error:
        return ","


def normalize_symbol_file(exchange: str, input_path: Path, output_path: Path) -> dict[str, object]:
    exchange_code = exchange.upper()
    if exchange_code not in MARKET_METADATA:
        raise ValueError(f"Unsupported exchange '{exchange}'.")
    if not input_path.exists():
        raise ValueError(f"Input file not found: {input_path}")

    raw_text = input_path.read_text(encoding="utf-8-sig")
    delimiter = _detect_delimiter(raw_text[:4096])

    normalized_rows: list[NormalizedRow] = []
    skipped_rows = 0
    seen_symbols: set[str] = set()

    with input_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle, delimiter=delimiter)
        for raw_row in reader:
            row = _normalize_header(raw_row)
            symbol = _pick(row, SYMBOL_ALIASES).upper()
            company_name = _pick(row, COMPANY_NAME_ALIASES)

            if not symbol or not company_name:
                skipped_rows += 1
                continue

            if symbol in seen_symbols:
                continue

            seen_symbols.add(symbol)
            sector = _pick(row, SECTOR_ALIASES) or "Unclassified"
            yahoo_symbol = _pick(row, YAHOO_SYMBOL_ALIASES).upper() or _infer_yahoo_symbol(exchange_code, symbol)
            currency = _pick(row, CURRENCY_ALIASES).upper() or str(MARKET_METADATA[exchange_code]["currency"])

            normalized_rows.append(
                NormalizedRow(
                    symbol=symbol,
                    company_name=company_name,
                    sector=sector,
                    yahoo_symbol=yahoo_symbol,
                    currency=currency,
                )
            )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["symbol", "company_name", "sector", "yahoo_symbol", "currency"])
        for row in normalized_rows:
            writer.writerow([row.symbol, row.company_name, row.sector, row.yahoo_symbol, row.currency])

    return {
        "exchange": exchange_code,
        "input_path": str(input_path),
        "output_path": str(output_path),
        "rows_written": len(normalized_rows),
        "rows_skipped": skipped_rows,
        "delimiter": repr(delimiter),
        "message": f"Prepared {len(normalized_rows)} cleaned rows for {exchange_code}.",
    }
