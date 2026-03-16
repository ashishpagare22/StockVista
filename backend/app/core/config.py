from dataclasses import dataclass
import os


@dataclass(frozen=True)
class Settings:
    app_name: str = "StockVista API"
    app_version: str = "0.1.0"
    default_market: str = "NSE"
    debug: bool = os.getenv("STOCKVISTA_DEBUG", "false").lower() == "true"


settings = Settings()
