from __future__ import annotations

from contextlib import contextmanager
import sqlite3

from app.core.config import settings


SCHEMA = """
CREATE TABLE IF NOT EXISTS markets (
    code TEXT PRIMARY KEY,
    benchmark TEXT NOT NULL,
    benchmark_symbol TEXT NOT NULL,
    benchmark_yahoo_symbol TEXT NOT NULL,
    currency TEXT NOT NULL,
    timezone TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS instruments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exchange TEXT NOT NULL,
    symbol TEXT NOT NULL,
    company_name TEXT NOT NULL,
    sector TEXT NOT NULL DEFAULT 'Unclassified',
    currency TEXT NOT NULL,
    yahoo_symbol TEXT NOT NULL,
    instrument_type TEXT NOT NULL DEFAULT 'equity',
    source TEXT NOT NULL,
    metadata_json TEXT NOT NULL DEFAULT '{}',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(exchange, symbol, instrument_type),
    FOREIGN KEY(exchange) REFERENCES markets(code) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_instruments_search
ON instruments(exchange, instrument_type, symbol, company_name);

CREATE TABLE IF NOT EXISTS daily_prices (
    instrument_id INTEGER NOT NULL,
    trade_date TEXT NOT NULL,
    open REAL NOT NULL,
    high REAL NOT NULL,
    low REAL NOT NULL,
    close REAL NOT NULL,
    adj_close REAL NOT NULL,
    volume INTEGER NOT NULL,
    source TEXT NOT NULL,
    inserted_at TEXT NOT NULL,
    PRIMARY KEY(instrument_id, trade_date),
    FOREIGN KEY(instrument_id) REFERENCES instruments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_daily_prices_lookup
ON daily_prices(instrument_id, trade_date);

CREATE TABLE IF NOT EXISTS corporate_actions (
    instrument_id INTEGER NOT NULL,
    action_date TEXT NOT NULL,
    action_type TEXT NOT NULL,
    description TEXT NOT NULL,
    source TEXT NOT NULL,
    inserted_at TEXT NOT NULL,
    PRIMARY KEY(instrument_id, action_date, action_type, description),
    FOREIGN KEY(instrument_id) REFERENCES instruments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sync_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exchange TEXT NOT NULL,
    target_symbol TEXT,
    run_type TEXT NOT NULL,
    status TEXT NOT NULL,
    source TEXT NOT NULL,
    message TEXT NOT NULL,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    instrument_count INTEGER NOT NULL DEFAULT 0,
    price_points INTEGER NOT NULL DEFAULT 0
);
"""


def ensure_storage_paths() -> None:
    settings.data_root.mkdir(parents=True, exist_ok=True)
    settings.imports_path.mkdir(parents=True, exist_ok=True)


@contextmanager
def db_connection():
    ensure_storage_paths()
    connection = sqlite3.connect(settings.database_path)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()


def initialize_database() -> None:
    ensure_storage_paths()
    with db_connection() as connection:
        connection.executescript(SCHEMA)
