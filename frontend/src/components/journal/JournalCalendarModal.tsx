import { useCallback, useEffect, useState } from 'react'
import { format, parseISO, startOfMonth } from 'date-fns'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { TradingCalendar } from '@/components/dashboard/TradingCalendar'
import { useDashboardStore } from '@/stores'

const modalEase = [0.22, 1, 0.36, 1] as const

interface JournalCalendarModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: string
  onSelect: (date: string) => void
}

export function JournalCalendarModal({
  open,
  onOpenChange,
  selectedDate,
  onSelect,
}: JournalCalendarModalProps) {
  const [currentMonth, setCurrentMonth] = useState(() =>
    startOfMonth(selectedDate ? parseISO(selectedDate) : new Date())
  )
  const monthKey = format(currentMonth, 'yyyy-MM')

  const calendarByKey = useDashboardStore((state) => state.calendarByKey)
  const fetchCalendarMonth = useDashboardStore((state) => state.fetchCalendarMonth)
  const calendarData = calendarByKey[monthKey]?.data ?? []
  const loading = open && !calendarByKey[monthKey]

  const handleMonthChange = useCallback((month: Date) => {
    setCurrentMonth((current) => {
      const next = startOfMonth(month)
      if (format(next, 'yyyy-MM') === format(current, 'yyyy-MM')) {
        return current
      }
      return next
    })
  }, [])

  useEffect(() => {
    if (!open) return
    fetchCalendarMonth(monthKey)
  }, [fetchCalendarMonth, monthKey, open])

  const handleSelect = (date: string) => {
    onSelect(date)
    onOpenChange(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="journal-calendar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: modalEase }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            key="journal-calendar-panel"
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.4, ease: modalEase }}
            className="glass-strong fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6 shadow-xl"
          >
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="absolute top-4 right-4 rounded-full p-1 text-white/60 transition-colors hover:text-white"
              aria-label="Close calendar"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="mb-6 pr-8 text-lg font-body font-semibold">Select a date</h2>

            <div className="relative">
              {loading && (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center rounded-xl bg-black/30 pt-16">
                  <p className="text-sm text-white/50">Loading trades…</p>
                </div>
              )}
              <TradingCalendar
                embedded
                showImportButton={false}
                allowEmptyDaySelection
                data={calendarData}
                selectedDate={selectedDate}
                currentMonth={currentMonth}
                onMonthChange={handleMonthChange}
                onDayClick={handleSelect}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
