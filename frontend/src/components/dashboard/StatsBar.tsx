import { GlassCard } from '@/components/layout/GlassCard'
import type { DashboardStats } from '@/lib/api'
import { formatCurrency, formatPercent } from '@/lib/utils'

interface StatsBarProps {
  stats?: DashboardStats
  loading?: boolean
}

const emptyStats: DashboardStats = {
  total_profit: 0,
  trade_winrate: 0,
  profit_factor: 0,
  avg_rr: '0:0',
  day_winrate: 0,
}

export function StatsBar({ stats = emptyStats, loading = false }: StatsBarProps) {
  const items = [
    { label: 'Total profit', value: formatCurrency(stats.total_profit) },
    { label: 'Trade Winrate', value: formatPercent(stats.trade_winrate) },
    { label: 'Profit factor', value: stats.profit_factor.toString() },
    { label: 'Avg RR', value: stats.avg_rr },
    { label: 'Day Winrate', value: formatPercent(stats.day_winrate) },
  ]

  return (
    <div className="mb-8 flex flex-wrap gap-4">
      {items.map((item) => (
        <GlassCard key={item.label} className="rounded-xl px-6 py-3">
          <p className="text-xs text-white/50">{item.label}</p>
          <p className="text-lg font-semibold text-white">
            {loading ? '—' : item.value}
          </p>
        </GlassCard>
      ))}
    </div>
  )
}
