/**
 * Generates synthetic 1-minute OHLCV candles for the trades in a CSV, as
 * JSON lines in the format lib/candleData.ts reads. The output is fake,
 * freely shareable, and deterministic for a given seed.
 *
 *   yarn generate:candles [--csv <file>] [--out <file>] [--seed <text>]
 *
 * Each trading day's price path passes through every trade's entry and exit
 * price at its entry/exit minute, so trade markers line up with the candles.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseTradesCsv } from './lib/parseCsv.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../..')

const TICK = 0.25
const VOLATILITY_PER_MINUTE = 3 // points, roughly NQ-like
const SESSION_START = '07:00:00'
const SESSION_END = '18:00:00'
// Matches lib/chartData.ts, which reads CSV session times as US Eastern daylight time.
const ET_OFFSET = '-04:00'

function argValue(name: string, fallback: string) {
  const index = process.argv.indexOf(`--${name}`)
  return index !== -1 && process.argv[index + 1] ? process.argv[index + 1] : fallback
}

const csvPath = path.resolve(argValue('csv', path.join(repoRoot, 'examples/sample-trades.csv')))
const outPath = path.resolve(
  argValue('out', path.join(repoRoot, 'sample-candlestick-data/synthetic-sample.ohlcv-1m.json'))
)
const seed = argValue('seed', 'trade-journal')

/** mulberry32 PRNG seeded from a string, so output is reproducible. */
function createRandom(seedText: string) {
  let state = 2166136261
  for (const char of seedText) state = Math.imul(state ^ char.charCodeAt(0), 16777619)
  const next = () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const normal = () => {
    const u = Math.max(next(), Number.EPSILON)
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * next())
  }
  return { next, normal }
}

const random = createRandom(seed)

function toUnix(date: string, time: string) {
  const [hours = '0', minutes = '0', seconds = '0'] = time.split(':')
  const iso = `${date}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}${ET_OFFSET}`
  return Math.floor(new Date(iso).getTime() / 1000)
}

const floorMinute = (unix: number) => Math.floor(unix / 60) * 60
const roundTick = (price: number) => Math.round(price / TICK) * TICK

/** Random walk from p0 to p1 over n steps (Brownian bridge). Returns n + 1 prices. */
function bridge(p0: number, p1: number, steps: number) {
  const walk = [0]
  for (let i = 1; i <= steps; i++) walk.push(walk[i - 1] + random.normal() * VOLATILITY_PER_MINUTE)
  return walk.map((w, i) => p0 + ((p1 - p0) * i) / steps + (w - (walk[steps] * i) / steps))
}

interface Anchor {
  time: number
  price: number
}

function buildDayCloses(date: string, anchors: Anchor[]) {
  const start = toUnix(date, SESSION_START)
  const end = toUnix(date, SESSION_END)

  const inner = anchors
    .filter((anchor) => anchor.time > start && anchor.time < end)
    .sort((a, b) => a.time - b.time)
    .filter((anchor, i, list) => i === 0 || anchor.time !== list[i - 1].time)

  const first = inner[0]?.price ?? 20000
  const last = inner[inner.length - 1]?.price ?? first
  const points: Anchor[] = [
    { time: start, price: first + random.normal() * 25 },
    ...inner,
    { time: end, price: last + random.normal() * 25 },
  ]

  const closes = new Map<number, number>()
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]
    const b = points[i + 1]
    const steps = (b.time - a.time) / 60
    bridge(a.price, b.price, steps).forEach((price, step) => {
      closes.set(a.time + step * 60, price)
    })
  }
  // Pin anchors exactly, so each trade's price sits on its candle's close.
  for (const anchor of inner) closes.set(anchor.time, anchor.price)
  return closes
}

function main() {
  const { trades } = parseTradesCsv(fs.readFileSync(csvPath, 'utf8'), 'generator', 'generator')
  if (trades.length === 0) throw new Error(`No trades found in ${csvPath}`)

  const anchorsByDay = new Map<string, { symbol: string; date: string; anchors: Anchor[] }>()
  for (const trade of trades) {
    const symbol = trade.asset.trim().toUpperCase()
    const key = `${symbol}|${trade.date}`
    const day = anchorsByDay.get(key) ?? { symbol, date: trade.date, anchors: [] }
    day.anchors.push({ time: floorMinute(toUnix(trade.date, trade.entry_time)), price: trade.entry_price })
    if (trade.exit_time && trade.exit_price !== null) {
      day.anchors.push({ time: floorMinute(toUnix(trade.date, trade.exit_time)), price: trade.exit_price })
    }
    anchorsByDay.set(key, day)
  }

  const lines: string[] = []
  const days = [...anchorsByDay.values()].sort((a, b) => a.date.localeCompare(b.date) || a.symbol.localeCompare(b.symbol))

  for (const { symbol, date, anchors } of days) {
    const closes = [...buildDayCloses(date, anchors).entries()].sort((a, b) => a[0] - b[0])
    let previousClose = closes[0][1]

    for (const [time, close] of closes) {
      const open = previousClose
      const wick = () => Math.abs(random.normal()) * VOLATILITY_PER_MINUTE * 0.6
      const high = Math.max(open, close) + wick()
      const low = Math.min(open, close) - wick()
      const minutesFromOpen = Math.abs(time - toUnix(date, '09:30:00')) / 60
      const volume = Math.round((150 + random.next() * 400) * (1 + 3 * Math.exp(-minutesFromOpen / 45)))

      lines.push(
        JSON.stringify({
          time: new Date(time * 1000).toISOString().replace('.000Z', 'Z'),
          symbol,
          open: roundTick(open),
          high: roundTick(high),
          low: roundTick(low),
          close: roundTick(close),
          volume,
        })
      )
      previousClose = close
    }
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, `${lines.join('\n')}\n`)
  console.log(
    `Wrote ${lines.length} synthetic candles for ${days.length} day(s) to ${path.relative(repoRoot, outPath)}`
  )
}

main()
