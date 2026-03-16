# StockVista API Specification

## `GET /health`

Returns service status.

### Response

```json
{
  "status": "ok"
}
```

## `GET /markets`

Returns supported exchanges and their benchmark metadata.

### Response Shape

```json
[
  {
    "code": "NSE",
    "benchmark": "Nifty 50",
    "currency": "INR",
    "timezone": "Asia/Kolkata"
  }
]
```

## `GET /stocks/search`

Searches the stock catalog for the selected exchange.

### Query Parameters

- `exchange`: required exchange code
- `query`: partial ticker or company name

## `GET /analysis`

Builds a full stock performance payload.

### Query Parameters

- `exchange`: required exchange code
- `query`: required ticker or company name
- `start_date`: optional `YYYY-MM-DD`
- `end_date`: optional `YYYY-MM-DD`

### Response Sections

- `market`
- `overview`
- `input`
- `price_snapshot`
- `returns`
- `technicals`
- `benchmark`
- `corporate_actions`
- `series`
- `benchmark_series`
- `summary`

## Error Handling

- `400`: invalid market, invalid date range, or empty query
- `404`: stock not found for the requested exchange
