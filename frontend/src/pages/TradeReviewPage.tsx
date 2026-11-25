import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { TradeDaySidebar } from '@/components/trades/TradeDaySidebar'
import { GlassCard } from '@/components/layout/GlassCard'
import { type Trade } from '@/lib/api'
import { cn, formatCurrency } from '@/lib/utils'
import { tradesKey, useTradesStore } from '@/stores/tradesStore'
import { useAccountsStore } from '@/stores'

function formatPrice(value?: number | null) {
  if (value === undefined || value === null) return '—'
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function Detail({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div>
      <dt className="text-sm text-white/50">{label}</dt>
      <dd className={cn('mt-1 text-lg', className)}>{value}</dd>
    </div>
  )
}

export function TradeReviewPage() {
  const { tradeId } = useParams()
  const fetchTradeDetail = useTradesStore((state) => state.fetchTradeDetail)
  const tradeById = useTradesStore((state) => state.tradeById)
  const tradesByKey = useTradesStore((state) => state.tradesByKey)
  const loadingTradeKey = useTradesStore((state) => state.loadingTradeKey)
  const accounts = useAccountsStore((state) => state.accounts)
  const fetchAccounts = useAccountsStore((state) => state.fetchAccounts)

  const [failure, setFailure] = useState<{ tradeId: string; message: string } | null>(null)

  const trade: Trade | undefined = tradeId ? tradeById[tradeId]?.data : undefined
  const dayTrades = trade
    ? (tradesByKey[tradesKey(trade.date, trade.account_id ? [trade.account_id] : [])]?.data ?? [])
    : []
  const error = failure && failure.tradeId === tradeId ? failure.message : null
  const loading = Boolean(tradeId) && !trade && loadingTradeKey === tradeId

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  useEffect(() => {
    if (!tradeId) return
    fetchTradeDetail(tradeId).catch((loadError) => {
      setFailure({
        tradeId,
        message: loadError instanceof Error ? loadError.message : 'Unable to load trade',
      })
    })
  }, [tradeId, fetchTradeDetail])

  const accountName = accounts.find((account) => account.id === trade?.account_id)?.name

  return (
    <div className="bg-mesh flex min-h-screen">
      {trade && <TradeDaySidebar date={trade.date} trades={dayTrades} activeTradeId={trade.id} />}

      <main className="flex min-w-0 flex-1 flex-col p-8">
        {loading && <p className="text-sm text-white/50">Loading trade…</p>}
        {error && <p className="text-sm text-loss">{error}</p>}

        {trade && (
          <div className="max-w-3xl">
            <div className="mb-6">
              <h1 className="text-2xl font-body">{trade.asset}</h1>
              <p className="mt-1 text-sm text-white/50">
                {format(parseISO(trade.date), 'MMMM d, yyyy')}
                {accountName ? ` · ${accountName}` : ''}
              </p>
            </div>

            <GlassCard className="p-6">
              <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <Detail
                  label="P&L"
                  value={formatCurrency(trade.pnl)}
                  className={trade.pnl >= 0 ? 'text-profit' : 'text-loss'}
                />
                <Detail label="Side" value={trade.side === 'long' ? 'Long' : 'Short'} />
                <Detail label="Entry time" value={trade.entry_time} />
                <Detail label="Exit time" value={trade.exit_time ?? '—'} />
                <Detail label="Entry price" value={formatPrice(trade.entry_price)} />
                <Detail label="Exit price" value={formatPrice(trade.exit_price)} />
              </dl>
            </GlassCard>
          </div>
        )}
      </main>
    </div>
  )
}
