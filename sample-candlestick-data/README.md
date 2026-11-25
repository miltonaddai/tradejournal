# Sample candlestick data

The backend reads 1-minute OHLCV files from this folder and serves the candles around each trade from `GET /api/charts/:tradeId`.

## Format

- File names end in `.ohlcv-1m.json` or `.ohlcv-1m.jsonl`
- One JSON record per line: `time` (ISO 8601 or unix seconds), `symbol`, `open`, `high`, `low`, `close`, and optionally `volume`
- Prices can be numbers or numeric strings

```json
{"time":"2026-07-01T13:30:00Z","symbol":"NQU6","open":21500,"high":21504.5,"low":21498,"close":21503.25,"volume":420}
```

Symbols are matched case-insensitively against the trade's symbol. Candles are grouped by US Eastern trading date.

## Synthetic data (committed, free to use)

`synthetic-sample.ohlcv-1m.json` is fake NQU6 and ESU6 data generated for the trades in `examples/sample-trades.csv`. It covers 07:00–18:00 ET for each symbol on each day it was traded. The price path passes through every trade's entry and exit price at its entry and exit minute, so the candles line up with the trades. It's MIT-licensed like the rest of the repo, so use it for sandboxes, tests, and demos.

Regenerate it, or generate candles for your own CSV, from the repo root:

```bash
yarn generate:candles                                   # sample CSV → synthetic-sample.ohlcv-1m.json
yarn generate:candles --csv my-trades.csv --out ../sample-candlestick-data/synthetic-mine.ohlcv-1m.json
yarn generate:candles --seed another-seed               # different (still deterministic) price paths
```

Output is deterministic for a given CSV and seed. Keep the `synthetic-` prefix: those files are committed, and they load before other files.

## Your own data (local only)

Other files you put here (for example, market data you've licensed) are gitignored, so they stay on your machine. When one covers the same symbol and day as a synthetic file, it replaces the synthetic candles for that day.

Set `CANDLE_DATA_DIR` in `backend/.env` to load from another folder.
