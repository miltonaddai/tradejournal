import {
  ensureCandleIndex,
  getHistoricalSessionCandles,
  type HistoricalCandle,
} from './candleData.js'

interface TradeForChart {
  asset: string
  date: string
  entry_time: string
  exit_time?: string | null
  entry_price: number
  exit_price?: number | null
  side: 'long' | 'short'
}

interface Candle {
  time: number
  open: number
  high: number
  low: number
  close: number
}

interface ChartMarker {
  time: number
  position: 'aboveBar' | 'belowBar'
  color: string
  shape: 'arrowUp' | 'arrowDown'
  text: string
}

export interface TradeChartPayload {
  symbol: string
  candles: Candle[]
  markers: ChartMarker[]
  visibleRange: { from: number; to: number }
  dataSource?: 'file' | 'generated'
}

function parseTimeToSeconds(time: string) {
  const match = time.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/)
  if (!match) return 9 * 3600 + 30 * 60
  const [, hours, minutes, seconds = '0'] = match
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds)
}

function dateTimeToUnix(date: string, time: string) {
  const seconds = parseTimeToSeconds(time)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  const iso = `${date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  // Session times in CSV exports are treated as US Eastern Time.
  return Math.floor(new Date(`${iso}-04:00`).getTime() / 1000)
}

function sessionBounds(date: string) {
  return {
    start: dateTimeToUnix(date, '08:00:00'),
    end: dateTimeToUnix(date, '17:00:00'),
  }
}

function floorToMinute(unix: number) {
  return Math.floor(unix / 60) * 60
}

function snapMarkerTime(unix: number, candles: Candle[]) {
  const minute = floorToMinute(unix)
  if (candles.some((candle) => candle.time === minute)) {
    return minute
  }

  const nearest = candles.reduce<{ time: number; diff: number } | null>((best, candle) => {
    const diff = Math.abs(candle.time - unix)
    if (!best || diff < best.diff) {
      return { time: candle.time, diff }
    }
    return best
  }, null)

  return nearest?.time ?? minute
}

function filterSessionCandles(candles: HistoricalCandle[], date: string) {
  const { start, end } = sessionBounds(date)
  return candles.filter((candle) => candle.time >= start && candle.time <= end)
}

function generateDayCandles(
  date: string,
  entryUnix: number,
  exitUnix: number,
  entryPrice: number,
  exitPrice: number
): Candle[] {
  const { start, end } = sessionBounds(date)
  const interval = 60
  const candles: Candle[] = []
  let price = entryPrice
  const duration = Math.max(exitUnix - entryUnix, 60)

  for (let time = start; time <= end; time += interval) {
    let target = price

    if (time < entryUnix) {
      const progress = Math.min(1, (time - start) / Math.max(entryUnix - start, 1))
      target = entryPrice - (entryPrice - exitPrice) * 0.15 * (1 - progress)
    } else if (time > exitUnix) {
      const progress = Math.min(1, (time - exitUnix) / Math.max(end - exitUnix, 1))
      target = exitPrice + (exitPrice - entryPrice) * 0.1 * progress
    } else {
      const progress = (time - entryUnix) / duration
      target = entryPrice + (exitPrice - entryPrice) * progress
    }

    const volatility = Math.max(entryPrice * 0.00015, 0.5)
    const noise = (Math.random() - 0.5) * volatility
    const open = price
    const close = target + noise
    const high = Math.max(open, close) + Math.random() * volatility
    const low = Math.min(open, close) - Math.random() * volatility

    candles.push({
      time,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
    })
    price = close
  }

  return candles
}

function buildMarkers(trade: TradeForChart, entryUnix: number, exitUnix: number, candles: Candle[]) {
  const entryMarker: ChartMarker = {
    time: snapMarkerTime(entryUnix, candles),
    position: trade.side === 'long' ? 'belowBar' : 'aboveBar',
    color: '#22c55e',
    shape: trade.side === 'long' ? 'arrowUp' : 'arrowDown',
    text: 'Entry',
  }

  const exitMarker: ChartMarker = {
    time: snapMarkerTime(exitUnix, candles),
    position: trade.side === 'long' ? 'aboveBar' : 'belowBar',
    color: '#ef4444',
    shape: trade.side === 'long' ? 'arrowDown' : 'arrowUp',
    text: 'Exit',
  }

  return [entryMarker, exitMarker]
}

function buildVisibleRange(date: string, entryUnix: number, exitUnix: number) {
  const padding = 20 * 60
  const tradeDuration = Math.max(exitUnix - entryUnix, 5 * 60)
  const zoomPadding = Math.max(padding, tradeDuration * 0.5)
  const { start: sessionStart, end: sessionEnd } = sessionBounds(date)

  return {
    from: Math.max(sessionStart, entryUnix - zoomPadding),
    to: Math.min(sessionEnd, exitUnix + zoomPadding),
  }
}

export async function buildTradeChartPayload(trade: TradeForChart): Promise<TradeChartPayload> {
  const entryUnix = dateTimeToUnix(trade.date, trade.entry_time)
  const exitUnix = trade.exit_time
    ? dateTimeToUnix(trade.date, trade.exit_time)
    : entryUnix + 5 * 60

  const symbol = trade.asset
  const entryPrice = Number(trade.entry_price) || 100
  const exitPrice = Number(trade.exit_price) || entryPrice

  await ensureCandleIndex()
  const historicalDay = getHistoricalSessionCandles(symbol, trade.date)
  const historicalCandles = historicalDay ? filterSessionCandles(historicalDay, trade.date) : null

  const candles =
    historicalCandles && historicalCandles.length > 0
      ? historicalCandles
      : generateDayCandles(trade.date, entryUnix, exitUnix, entryPrice, exitPrice)

  const markers = buildMarkers(trade, entryUnix, exitUnix, candles)
  const visibleRange = buildVisibleRange(trade.date, entryUnix, exitUnix)

  return {
    symbol,
    candles,
    markers,
    visibleRange,
    dataSource: historicalCandles && historicalCandles.length > 0 ? 'file' : 'generated',
  }
}
