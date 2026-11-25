import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import { fileURLToPath } from 'node:url'

/**
 * Loads 1-minute OHLCV candles from `*.ohlcv-1m.json` / `*.ohlcv-1m.jsonl`
 * files (one JSON record per line) in CANDLE_DATA_DIR:
 *
 *   {"time":"2026-07-01T13:30:00Z","symbol":"NQU6","open":21500,"high":21504.5,"low":21498,"close":21503.25,"volume":420}
 *
 * `time` may be an ISO 8601 string or unix seconds; prices may be numbers or
 * numeric strings. Files whose names start with `synthetic` load first, so any
 * other file covering the same symbol and day replaces them.
 */

export interface HistoricalCandle {
  time: number
  open: number
  high: number
  low: number
  close: number
}

interface CandleRecord {
  time?: string | number
  symbol?: string
  open?: string | number
  high?: string | number
  low?: string | number
  close?: string | number
}

type DayIndex = Map<string, HistoricalCandle[]>
type SymbolIndex = Map<string, DayIndex>

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const defaultDataDir = path.resolve(__dirname, '../../../sample-candlestick-data')

let symbolIndex: SymbolIndex | null = null
let loadPromise: Promise<boolean> | null = null

function getDataDir() {
  return process.env.CANDLE_DATA_DIR || defaultDataDir
}

function findCandleFiles(dataDir: string) {
  if (!fs.existsSync(dataDir)) return []
  const isSynthetic = (file: string) => file.startsWith('synthetic')
  return fs
    .readdirSync(dataDir)
    .filter((file) => file.endsWith('.ohlcv-1m.json') || file.endsWith('.ohlcv-1m.jsonl'))
    .sort((a, b) => Number(isSynthetic(b)) - Number(isSynthetic(a)) || a.localeCompare(b))
    .map((file) => path.join(dataDir, file))
}

function formatEtDate(unixSeconds: number) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(unixSeconds * 1000))
}

function parseTime(value: CandleRecord['time']) {
  if (typeof value === 'number') return Math.floor(value)
  if (typeof value !== 'string') return null
  const ms = new Date(value).getTime()
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : null
}

async function indexFile(filePath: string): Promise<SymbolIndex> {
  const index: SymbolIndex = new Map()
  const stream = fs.createReadStream(filePath, { encoding: 'utf8' })
  const lineReader = readline.createInterface({ input: stream, crlfDelay: Infinity })

  for await (const line of lineReader) {
    const trimmed = line.trim()
    if (!trimmed) continue

    let record: CandleRecord
    try {
      record = JSON.parse(trimmed) as CandleRecord
    } catch {
      continue
    }

    const symbol = record.symbol?.trim().toUpperCase()
    const time = parseTime(record.time)
    if (!symbol || time === null) continue

    const candle: HistoricalCandle = {
      time,
      open: Number(record.open),
      high: Number(record.high),
      low: Number(record.low),
      close: Number(record.close),
    }
    if (![candle.open, candle.high, candle.low, candle.close].every(Number.isFinite)) continue

    let dayIndex = index.get(symbol)
    if (!dayIndex) {
      dayIndex = new Map()
      index.set(symbol, dayIndex)
    }
    const date = formatEtDate(time)
    const dayCandles = dayIndex.get(date)
    if (dayCandles) dayCandles.push(candle)
    else dayIndex.set(date, [candle])
  }

  for (const dayIndex of index.values()) {
    for (const [date, candles] of dayIndex.entries()) {
      candles.sort((a, b) => a.time - b.time)
      const deduped: HistoricalCandle[] = []
      for (const candle of candles) {
        const last = deduped[deduped.length - 1]
        if (last && last.time === candle.time) deduped[deduped.length - 1] = candle
        else deduped.push(candle)
      }
      dayIndex.set(date, deduped)
    }
  }

  return index
}

async function loadIndex(): Promise<boolean> {
  const files = findCandleFiles(getDataDir())
  if (files.length === 0) return false

  const merged: SymbolIndex = new Map()
  for (const filePath of files) {
    for (const [symbol, days] of await indexFile(filePath)) {
      let dayIndex = merged.get(symbol)
      if (!dayIndex) {
        dayIndex = new Map()
        merged.set(symbol, dayIndex)
      }
      for (const [date, candles] of days) dayIndex.set(date, candles)
    }
  }

  symbolIndex = merged
  console.log(
    `Candlestick data loaded from ${files.map((file) => path.basename(file)).join(', ')}`
  )
  return true
}

export async function ensureCandleIndex() {
  if (symbolIndex) return true
  if (!loadPromise) {
    loadPromise = loadIndex().catch((error) => {
      console.warn('Failed to load candlestick data:', error)
      loadPromise = null
      return false
    })
  }
  return loadPromise
}

export function getHistoricalSessionCandles(asset: string, date: string) {
  if (!symbolIndex) return null
  return symbolIndex.get(asset.trim().toUpperCase())?.get(date) ?? null
}
