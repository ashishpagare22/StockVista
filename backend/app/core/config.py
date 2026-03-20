from dataclasses import dataclass
import os
from pathlib import Path


def _as_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


BACKEND_ROOT = Path(__file__).resolve().parents[2]
DATA_ROOT = BACKEND_ROOT / "data"
DEFAULT_DB_PATH = DATA_ROOT / "stockvista.db"
DEFAULT_IMPORTS_PATH = DATA_ROOT / "imports"


@dataclass(frozen=True)
class Settings:
    app_name: str = "StockVista API"
    app_version: str = "0.2.0"
    default_market: str = "NSE"
    debug: bool = _as_bool(os.getenv("STOCKVISTA_DEBUG"), default=False)
    backend_root: Path = BACKEND_ROOT
    data_root: Path = DATA_ROOT
    database_path: Path = Path(os.getenv("STOCKVISTA_DB_PATH", str(DEFAULT_DB_PATH)))
    imports_path: Path = Path(os.getenv("STOCKVISTA_IMPORTS_PATH", str(DEFAULT_IMPORTS_PATH)))
    default_history_days: int = int(os.getenv("STOCKVISTA_DEFAULT_HISTORY_DAYS", "400"))
    search_limit: int = int(os.getenv("STOCKVISTA_SEARCH_LIMIT", "12"))
    auto_refresh_on_startup: bool = _as_bool(os.getenv("STOCKVISTA_AUTO_REFRESH_ON_STARTUP"), default=False)
    sec_user_agent: str = os.getenv(
        "STOCKVISTA_SEC_USER_AGENT",
        "StockVista local research app stockvista@example.com",
    )


settings = Settings()
