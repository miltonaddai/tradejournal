import { format, parseISO } from 'date-fns'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn, formatCurrency } from '@/lib/utils'
import type { Trade } from '@/lib/api'

interface TradeDaySidebarProps {
  date: string
  trades: Trade[]
  activeTradeId: string
}

export function TradeDaySidebar({ date, trades, activeTradeId }: TradeDaySidebarProps) {
  const navigate = useNavigate()
  const formattedDate = format(parseISO(date), 'MMMM do')

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
      <button
        onClick={() => navigate('/app/dashboard')}
        className="mb-6 flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="font-sketch">Trades on {formattedDate}</span>
      </button>

      <div className="flex flex-col gap-2 overflow-y-auto">
        {trades.length === 0 && (
          <p className="text-sm text-white/45">No other trades for this day.</p>
        )}
        {trades.map((trade, index) => (
          <button
            key={trade.id}
            onClick={() => navigate(`/app/trades/${trade.id}`)}
            className={cn(
              'rounded-lg border px-4 py-3 text-left text-sm transition-colors',
              activeTradeId === trade.id
                ? 'border-accent/40 bg-accent/20 text-white'
                : 'border-white/10 bg-white/[0.04] text-white/80 hover:bg-white/[0.08]'
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate">
                {trade.asset} · {trade.entry_time}
              </span>
              <span className={cn('shrink-0', trade.pnl >= 0 ? 'text-profit' : 'text-loss')}>
                {formatCurrency(trade.pnl)}
              </span>
            </div>
            <p className="mt-1 text-xs text-white/40">
              Trade {index + 1} · {trade.side}
            </p>
          </button>
        ))}
      </div>
    </aside>
  )
}
