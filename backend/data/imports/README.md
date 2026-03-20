Place optional symbol master CSV files here to unlock larger market coverage.

Expected filenames:

- `nse_symbols.csv`
- `bse_symbols.csv`
- `nasdaq_symbols.csv`

Supported column aliases:

- symbol: `symbol`, `ticker`, `security id`, `security_id`, `trading symbol`, `trading_symbol`
- company name: `company_name`, `name`, `company`, `company name`, `security name`, `issuer name`
- sector: `sector`, `industry`, `industry name`
- yahoo symbol override: `yahoo_symbol`, `finance_symbol`
- currency: `currency`

If `yahoo_symbol` is omitted:

- `NSE` defaults to `SYMBOL.NS`
- `BSE` defaults to `SYMBOL.BO`
- `NASDAQ` defaults to `SYMBOL`

StockVista imports these files into the local SQLite database on startup and during catalog refreshes.

If you have a raw exchange CSV/TSV with messy headers, you can normalize it first:

```cmd
prepare-stockvista-import.bat NSE "C:\path\to\raw-file.csv"
prepare-stockvista-import.bat BSE "C:\path\to\raw-file.tsv"
```

This will write cleaned files into this folder automatically.
