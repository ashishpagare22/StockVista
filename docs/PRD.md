# StockVista Product Requirements

## Product Summary

StockVista helps users analyze historical stock performance across multiple exchanges in one place. The first release focuses on `BSE`, `NSE`, and `NASDAQ`.

## Problem Statement

Users often need to jump between multiple sites to compare stocks across markets, understand returns for a date range, and read summary insights. StockVista brings those workflows into one structured dashboard.

## Target Users

- Retail investors who want quick performance summaries
- Students learning market behavior
- Analysts who need a lightweight comparison surface

## MVP Goals

- Support market-specific analysis for `BSE`, `NSE`, and `NASDAQ`
- Accept stock name or ticker plus date/date-range input
- Show return calculations, benchmark comparison, and technical indicators
- Provide a simple narrative summary of the selected stock's trend

## Core User Journey

1. Select exchange
2. Search for a stock by company name or ticker
3. Choose a start date and end date
4. Review the analysis sections

## MVP Features

- Market tabs for `BSE`, `NSE`, and `NASDAQ`
- Search field for stock name or symbol
- Date filter for historical range
- Overview card for company details
- Price-performance section with range returns
- Benchmark comparison against market index
- Technical indicators: `20DMA`, `50DMA`, `RSI`
- Corporate actions feed for splits/dividends within the range
- AI-ready summary area for future narrative enhancement

## Non-Goals

- Live trading or order placement
- Real-time streaming quotes
- Portfolio accounting in the first release

## Success Criteria

- Users can retrieve an analysis in under 3 seconds under normal load
- Users can understand whether a stock outperformed or underperformed its benchmark
- The app can add another exchange without a major refactor
