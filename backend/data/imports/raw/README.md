Drop raw exchange files here if you want a simple place to stage them before normalization.

Example:

- `backend\data\imports\raw\nse_raw.csv`
- `backend\data\imports\raw\bse_raw.tsv`

Then run from the project root:

- `prepare-stockvista-import.bat NSE "backend\data\imports\raw\nse_raw.csv"`
- `prepare-stockvista-import.bat BSE "backend\data\imports\raw\bse_raw.tsv"`

The cleaned output will be written into:

- `backend\data\imports\nse_symbols.csv`
- `backend\data\imports\bse_symbols.csv`
