import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Upload } from 'lucide-react'
import { motion } from 'framer-motion'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  parseISO,
} from 'date-fns'
import { GlassCard } from '@/components/layout/GlassCard'
import { Button } from '@/components/ui/button'
import { cn, formatCurrency, formatPercent } from '@/lib/utils'
import type { CalendarDay } from '@/lib/api'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface TradingCalendarProps {
  data?: CalendarDay[]
  currentMonth: Date
  onMonthChange: (month: Date) => void
  onDayClick?: (date: string) => void
  selectedDate?: string | null
  showImportButton?: boolean
  embedded?: boolean
  allowEmptyDaySelection?: boolean
  headerRight?: React.ReactNode
}

export function TradingCalendar({
  data,
  currentMonth,
  onMonthChange,
  onDayClick,
  selectedDate,
  showImportButton = true,
  embedded = false,
  allowEmptyDaySelection = false,
  headerRight,
}: TradingCalendarProps) {
  const lastSyncedDateRef = useRef<string | null>(null)

  useEffect(() => {
    if (!selectedDate || lastSyncedDateRef.current === selectedDate) return
    lastSyncedDateRef.current = selectedDate
    onMonthChange(startOfMonth(parseISO(selectedDate)))
  }, [selectedDate, onMonthChange])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPadding = getDay(monthStart)

  const dayMap: Record<string, { pnl: number; trade_count: number; winrate: number }> = {}
  data?.forEach((day) => {
    dayMap[day.date] = {
      pnl: day.pnl,
      trade_count: day.trade_count,
      winrate: day.winrate ?? 0,
    }
  })

  const calendar = (
    <>
      <div className="mb-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div />
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => onMonthChange(subMonths(currentMonth, 1))}
            className="rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-body">{format(currentMonth, 'MMMM yyyy')}</h2>
          <button
            type="button"
            onClick={() => onMonthChange(addMonths(currentMonth, 1))}
            className="rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center justify-end gap-2">
          {headerRight}
          {showImportButton && (
            <Button asChild size="sm" variant="outline">
              <Link to="/app/import">
                <Upload className="h-4 w-4" />
                Import
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 md:gap-3">
        {WEEKDAYS.map((label) => (
          <div
            key={label}
            className="pb-1 text-center text-xs font-medium tracking-wide text-white/40 uppercase"
          >
            {label}
          </div>
        ))}

        {Array.from({ length: startPadding }).map((_, i) => (
          <div
            key={`pad-${i}`}
            className="min-h-[6.5rem] rounded-xl border border-dashed border-white/5 bg-white/[0.02] md:min-h-[7.5rem]"
          />
        ))}

        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const stats = dayMap[dateStr]
          const isSelected = selectedDate === dateStr
          const hasTrades = stats !== undefined
          const isClickable = allowEmptyDaySelection || hasTrades

          return (
            <motion.button
              key={dateStr}
              type="button"
              whileHover={isClickable ? { scale: 1.02 } : undefined}
              whileTap={isClickable ? { scale: 0.98 } : undefined}
              onClick={() => isClickable && onDayClick?.(dateStr)}
              disabled={!isClickable}
              className={cn(
                'flex min-h-[6.5rem] flex-col rounded-xl border p-2 text-left transition-all md:min-h-[7.5rem] md:p-3',
                hasTrades
                  ? 'glass-dark hover:border-white/20'
                  : 'border-white/5 bg-white/[0.02]',
                isClickable && 'cursor-pointer',
                !isClickable && 'cursor-default',
                isSelected && 'border-accent/60 ring-2 ring-accent/30'
              )}
            >
              <span className="font-sketch text-base text-white/70 md:text-lg">{format(day, 'd')}</span>

              {hasTrades ? (
                <div className="mt-auto space-y-0.5">
                  <p
                    className={cn(
                      'text-sm font-semibold leading-tight',
                      stats.pnl >= 0 ? 'text-profit' : 'text-loss'
                    )}
                  >
                    {formatCurrency(stats.pnl)}
                  </p>
                  <p className="text-[11px] leading-tight text-white/50 md:text-xs">
                    {stats.trade_count} {stats.trade_count === 1 ? 'trade' : 'trades'}
                  </p>
                  <p className="text-[11px] leading-tight text-white/40 md:text-xs">
                    {formatPercent(stats.winrate)} WR
                  </p>
                </div>
              ) : (
                <div className="mt-auto h-px w-6 bg-white/5" />
              )}
            </motion.button>
          )
        })}
      </div>
    </>
  )

  if (embedded) return calendar

  return <GlassCard className="p-6">{calendar}</GlassCard>
}
