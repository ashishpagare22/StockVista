# Calculation Rules

## Return Metrics

- `absolute_return = ending_close - starting_close`
- `percent_return = (absolute_return / starting_close) * 100`

## Benchmark Comparison

- Benchmark return is calculated across the same selected date range
- Relative performance equals stock return percentage minus benchmark return percentage

## Technical Indicators

- `20DMA`: average close of the latest 20 trading sessions
- `50DMA`: average close of the latest 50 trading sessions
- `RSI`: 14-period relative strength index

## Volatility

- Daily returns are derived from consecutive closing prices
- Annualized volatility is the standard deviation of daily returns multiplied by `sqrt(252)`

## Drawdown

- Max drawdown is measured from the highest observed close to the deepest decline afterward within the selected range

## Holiday and Weekend Handling

- Business-day generation skips Saturdays and Sundays
- A single-date weekend request is shifted to the previous trading day in the mock provider flow

## Corporate Actions

- The mock provider emits split/dividend events if their action date falls within the selected range
- Real vendor integrations should use adjusted history when possible
