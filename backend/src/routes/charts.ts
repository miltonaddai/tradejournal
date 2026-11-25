import { Router } from 'express'
import { localUser, type AppRequest } from '../middleware/localUser.js'
import { db } from '../db/store.js'
import { buildTradeChartPayload } from '../lib/chartData.js'

const router = Router()

/** 1-minute candles around a trade, from the candle data files or generated on the fly. */
router.get('/:tradeId', localUser, async (req: AppRequest, res) => {
  const trade = db.trades.find(
    (item) => item.id === req.params.tradeId && item.user_id === req.userId
  )

  if (!trade) {
    return res.status(404).json({ message: 'Trade not found' })
  }

  res.json(await buildTradeChartPayload(trade))
})

export default router
