import Papa from 'papaparse'

export interface ParsedTradeRow {
  user_id: string
  account_id: string
  asset: string
  entry_time: string
  exit_time: string | null
  pnl: number
  side: 'long' | 'short'
  entry_price: number
  exit_price: number | null
  date: string
}

function normalizeHeader(header: string) {
  return header.trim().toLowerCase().replace(/\s+/g, '_')
}

function pickValue(row: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== '') return value
  }
  return ''
}

function parseSide(value: string): 'long' | 'short' {
  const normalized = value.trim().toLowerCase()
  return normalized === 'short' || normalized === 'sell' ? 'short' : 'long'
}

function parseNumber(value: string) {
  const parsed = Number.parseFloat(value.replace(/[$,]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function extractTime(value: string) {
  const match = value.match(/(\d{1,2}:\d{2}:\d{2})/)
  return match?.[1] ?? '00:00'
}

function normalizeDate(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return new Date().toISOString().split('T')[0]

  const datePrefix = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/)
  if (datePrefix) {
    const [, month, day, yearRaw] = datePrefix
    const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed

  const parsed = new Date(trimmed)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0]
  }

  return new Date().toISOString().split('T')[0]
}

export function parseTradesCsv(csvContent: string, userId: string, accountId: string) {
  const parsed = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: normalizeHeader,
  })

  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors[0]?.message || 'Unable to parse CSV file')
  }

  const trades: ParsedTradeRow[] = parsed.data
    .map((row) => {
      const asset = pickValue(row, ['symbol', 'asset', 'ticker', 'instrument', 'contractname'])
      if (!asset) return null

      const enteredAt = pickValue(row, ['enteredat', 'entry_time', 'time', 'open_time', 'entry'])
      const exitedAt = pickValue(row, ['exitedat', 'exit_time', 'close_time', 'exit'])
      const tradeDay = pickValue(row, ['tradeday', 'date', 'trade_date', 'day', 'closed_at'])

      return {
        user_id: userId,
        account_id: accountId,
        asset,
        entry_time: extractTime(enteredAt) || enteredAt || '00:00',
        exit_time: exitedAt ? extractTime(exitedAt) || exitedAt : null,
        pnl: parseNumber(pickValue(row, ['pnl', 'profit', 'net_pnl', 'pl', 'p&l'])),
        side: parseSide(pickValue(row, ['side', 'direction', 'type'])),
        entry_price: parseNumber(
          pickValue(row, ['entryprice', 'entry_price', 'price', 'open_price', 'avg_entry'])
        ),
        exit_price:
          parseNumber(pickValue(row, ['exitprice', 'exit_price', 'close_price', 'avg_exit'])) || null,
        date: normalizeDate(tradeDay || enteredAt),
      }
    })
    .filter((trade): trade is ParsedTradeRow => trade !== null)

  return {
    trades,
    preview: parsed.data.slice(0, 5),
    rowCount: trades.length,
  }
}
