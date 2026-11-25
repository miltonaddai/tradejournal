import { Router } from 'express'
import multer from 'multer'
import { localUser, type AppRequest } from '../middleware/localUser.js'
import { db, type TradeRow } from '../db/store.js'
import { importTradesFromCsv } from '../lib/importService.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

function parseAccountIds(value: unknown): string[] | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined
  const ids = value
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
  return ids.length > 0 ? ids : undefined
}

function userTrades(req: AppRequest) {
  const accountIds = parseAccountIds(req.query.account_ids)
  return db.trades.filter(
    (trade) =>
      trade.user_id === req.userId &&
      (!accountIds || (trade.account_id !== null && accountIds.includes(trade.account_id)))
  )
}

function computeStats(trades: TradeRow[]) {
  const totalProfit = trades.reduce((sum, trade) => sum + Number(trade.pnl || 0), 0)
  const winningTrades = trades.filter((trade) => Number(trade.pnl) > 0).length
  const grossProfit = trades
    .filter((trade) => Number(trade.pnl) > 0)
    .reduce((sum, trade) => sum + Number(trade.pnl), 0)
  const grossLoss = Math.abs(
    trades.filter((trade) => Number(trade.pnl) < 0).reduce((sum, trade) => sum + Number(trade.pnl), 0)
  )

  const dayResults: Record<string, number> = {}
  trades.forEach((trade) => {
    dayResults[trade.date] = (dayResults[trade.date] || 0) + Number(trade.pnl)
  })
  const tradingDays = Object.keys(dayResults).length
  const winningDays = Object.values(dayResults).filter((pnl) => pnl > 0).length

  return {
    total_profit: totalProfit,
    trade_winrate: trades.length ? Math.round((winningTrades / trades.length) * 100) : 0,
    profit_factor: grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : grossProfit > 0 ? grossProfit : 0,
    avg_rr: '1:2',
    day_winrate: tradingDays ? Math.round((winningDays / tradingDays) * 100) : 0,
  }
}

router.get('/stats', localUser, (req: AppRequest, res) => {
  res.json(computeStats(userTrades(req)))
})

router.get('/calendar', localUser, (req: AppRequest, res) => {
  const month = req.query.month
  if (typeof month !== 'string' || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ message: 'Month is required (YYYY-MM)' })
  }

  const grouped: Record<string, { pnl: number; trade_count: number; wins: number }> = {}
  userTrades(req)
    .filter((trade) => trade.date.startsWith(`${month}-`))
    .forEach((trade) => {
      if (!grouped[trade.date]) {
        grouped[trade.date] = { pnl: 0, trade_count: 0, wins: 0 }
      }
      grouped[trade.date].pnl += Number(trade.pnl)
      grouped[trade.date].trade_count += 1
      if (Number(trade.pnl) > 0) grouped[trade.date].wins += 1
    })

  res.json(
    Object.entries(grouped).map(([date, value]) => ({
      date,
      pnl: value.pnl,
      trade_count: value.trade_count,
      winrate: value.trade_count ? Math.round((value.wins / value.trade_count) * 100) : 0,
    }))
  )
})

router.get('/', localUser, (req: AppRequest, res) => {
  const { date } = req.query
  const trades = userTrades(req)
    .filter((trade) => (typeof date === 'string' ? trade.date === date : true))
    .sort((a, b) => a.entry_time.localeCompare(b.entry_time))
  res.json(trades)
})

router.get('/:id', localUser, (req: AppRequest, res) => {
  const trade = db.trades.find((item) => item.id === req.params.id && item.user_id === req.userId)
  if (!trade) return res.status(404).json({ message: 'Trade not found' })
  res.json(trade)
})

router.post('/import', localUser, upload.single('file'), (req: AppRequest, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' })
  }

  const accountId = typeof req.body.accountId === 'string' ? req.body.accountId : undefined
  const accountName = typeof req.body.accountName === 'string' ? req.body.accountName : undefined

  if (!accountId && !accountName?.trim()) {
    return res.status(400).json({ message: 'Account name is required' })
  }

  try {
    const result = importTradesFromCsv(req.userId!, req.file.buffer.toString('utf-8'), {
      accountId,
      accountName,
    })
    return res.json({
      message: 'Import completed',
      status: 'completed',
      trades_imported: result.imported,
      account_id: result.account_id,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Import failed'
    return res.status(400).json({ message })
  }
})

export default router
