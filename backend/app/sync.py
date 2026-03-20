from __future__ import annotations

import argparse
import json
from pathlib import Path

from app.core.config import settings
from app.services.market_data.import_normalizer import normalize_symbol_file
from app.services.market_data.sync_service import build_refresh_status, refresh_catalogs, refresh_symbol_history


def main() -> None:
    parser = argparse.ArgumentParser(description="StockVista local sync tooling")
    subparsers = parser.add_subparsers(dest="command", required=True)

    bootstrap_parser = subparsers.add_parser("bootstrap", help="Refresh the local symbol master")
    bootstrap_parser.add_argument(
        "--skip-nasdaq",
        action="store_true",
        help="Skip the SEC-backed Nasdaq catalog import.",
    )

    history_parser = subparsers.add_parser("refresh-history", help="Refresh one symbol into the local cache")
    history_parser.add_argument("--exchange", required=True, help="Exchange code like NSE, BSE, or NASDAQ")
    history_parser.add_argument("--query", required=True, help="Ticker or company name")
    history_parser.add_argument("--days-back", type=int, default=None, help="Number of calendar days to fetch")

    prepare_parser = subparsers.add_parser("prepare-import", help="Normalize a raw symbol file into StockVista CSV format")
    prepare_parser.add_argument("--exchange", required=True, help="Exchange code like NSE, BSE, or NASDAQ")
    prepare_parser.add_argument("--input", required=True, help="Path to the raw CSV/TSV file")
    prepare_parser.add_argument(
        "--output",
        required=False,
        help="Optional output CSV path. Defaults to backend/data/imports/<exchange>_symbols.csv",
    )

    subparsers.add_parser("status", help="Print the current local refresh status")

    args = parser.parse_args()

    if args.command == "bootstrap":
        payload = refresh_catalogs(include_remote_nasdaq=not args.skip_nasdaq)
    elif args.command == "refresh-history":
        payload = refresh_symbol_history(
            exchange=args.exchange,
            query=args.query,
            days_back=args.days_back,
            force=True,
        )
    elif args.command == "prepare-import":
        default_output = settings.imports_path / f"{args.exchange.strip().lower()}_symbols.csv"
        payload = normalize_symbol_file(
            exchange=args.exchange,
            input_path=Path(args.input),
            output_path=Path(args.output) if args.output else default_output,
        )
    else:
        payload = build_refresh_status()

    print(json.dumps(payload, indent=2, default=str))


if __name__ == "__main__":
    main()
