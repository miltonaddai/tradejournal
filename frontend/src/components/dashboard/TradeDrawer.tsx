import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { cn, formatCurrency } from '@/lib/utils'
import { accountIdsKey } from '@/stores/utils'
import { useTradesStore } from '@/stores'

const drawerEase = [0.22, 1, 0.36, 1] as const

interface TradeDrawerProps {
  date: string | null
  accountIds?: string[]
  onClose: () => void
  onTradeSelect: (tradeId: string) => void
}

export function TradeDrawer({ date, accountIds = [], onClose, onTradeSelect }: TradeDrawerProps) {
  const fetchTradesForDay = useTradesStore((state) => state.fetchTradesForDay)
  const tradesByKey = useTradesStore((state) => state.tradesByKey)
  const loadingTradeKey = useTradesStore((state) => state.loadingTradeKey)

  const cacheKey = date ? `${date}:${accountIdsKey(accountIds)}` : ''
  const trades = cacheKey ? (tradesByKey[cacheKey]?.data ?? []) : []
  const loading = Boolean(date && loadingTradeKey === cacheKey && trades.length === 0)

  useEffect(() => {
    if (!date || accountIds.length === 0) return
    fetchTradesForDay(date, accountIds)
  }, [accountIds, date, fetchTradesForDay])

  const formattedDate = date ? format(parseISO(date), 'MMMM do') : ''

  return (
    <AnimatePresence>
      {date && (
        <>
          <motion.div
            key="trade-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: drawerEase }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="trade-drawer-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.4, ease: drawerEase }}
            className="fixed top-0 right-0 z-50 flex h-full w-96 flex-col border-l border-white/10 bg-[#0d0d0d]/95 p-6 backdrop-blur-xl"
          >
            <h2 className="text-xl font-body font-semibold">Trades on {formattedDate}</h2>
            <hr className="my-5 border-white/10" />
            <div className="flex flex-col gap-3 overflow-y-auto">
              {loading && <p className="text-sm text-white/45">Loading trades…</p>}
              {!loading && trades.length === 0 && (
                <p className="text-sm text-white/45">No trades for this day.</p>
              )}
              {trades.map((trade, i) => (
                <button
                  key={trade.id}
                  onClick={() => onTradeSelect(trade.id)}
                  className={cn(
                    'glass rounded-lg px-4 py-3 text-left text-sm transition-colors hover:bg-white/10'
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span>
                      trade {i + 1} {trade.asset} - {trade.entry_time}
                    </span>
                    <span className={trade.pnl >= 0 ? 'text-profit' : 'text-loss'}>
                      {formatCurrency(trade.pnl)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
