import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, startOfMonth } from 'date-fns'
import { motion } from 'framer-motion'
import { AppLayout } from '@/components/layout/Sidebar'
import { StatsBar } from '@/components/dashboard/StatsBar'
import { TradingCalendar } from '@/components/dashboard/TradingCalendar'
import { TradeDrawer } from '@/components/dashboard/TradeDrawer'
import { AccountMultiSelect } from '@/components/dashboard/AccountMultiSelect'
import { dashboardSectionVariants, useAnimateEntry } from '@/lib/app-entry'
import { accountIdsKey } from '@/stores/utils'
import { useAccountsStore, useDashboardStore } from '@/stores'

export function DashboardPage() {
  const navigate = useNavigate()
  const animateEntry = useAnimateEntry()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()))

  const accounts = useAccountsStore((state) => state.accounts)
  const fetchAccounts = useAccountsStore((state) => state.fetchAccounts)
  const accountsInitialized = useAccountsStore((state) => state.fetchedAt !== null)

  const selectedAccountIds = useDashboardStore((state) => state.selectedAccountIds)
  const setSelectedAccountIds = useDashboardStore((state) => state.setSelectedAccountIds)
  const fetchDashboard = useDashboardStore((state) => state.fetchDashboard)
  const loadingCalendar = useDashboardStore((state) => state.loadingCalendar)
  const loadingStats = useDashboardStore((state) => state.loadingStats)
  const calendarByKey = useDashboardStore((state) => state.calendarByKey)
  const statsByKey = useDashboardStore((state) => state.statsByKey)

  const monthKey = format(currentMonth, 'yyyy-MM')
  const calendarCacheKey = `${monthKey}:${accountIdsKey(selectedAccountIds)}`
  const statsCacheKey = accountIdsKey(selectedAccountIds)
  const calendarData = calendarByKey[calendarCacheKey]?.data ?? []
  const stats = statsByKey[statsCacheKey]?.data
  const loading = loadingCalendar || loadingStats

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  useEffect(() => {
    if (!accountsInitialized) return

    if (selectedAccountIds.length === 0 && accounts.length > 0) {
      setSelectedAccountIds(accounts.map((account) => account.id))
      return
    }

    fetchDashboard(monthKey, selectedAccountIds)
  }, [
    accounts,
    accountsInitialized,
    fetchDashboard,
    monthKey,
    selectedAccountIds,
    setSelectedAccountIds,
  ])

  const handleDayClick = (date: string) => {
    setSelectedDate(date)
  }

  const handleTradeSelect = (tradeId: string) => {
    navigate(`/app/trades/${tradeId}`)
  }

  return (
    <AppLayout>
      <motion.div
        variants={dashboardSectionVariants}
        custom={0}
        initial={animateEntry ? 'hidden' : false}
        animate="visible"
      >
        <StatsBar stats={stats} loading={loading && !stats} />
      </motion.div>
      <motion.div
        variants={dashboardSectionVariants}
        custom={1}
        initial={animateEntry ? 'hidden' : false}
        animate="visible"
      >
        <TradingCalendar
          data={calendarData}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          selectedDate={selectedDate}
          onDayClick={handleDayClick}
          headerRight={
            <AccountMultiSelect
              accounts={accounts}
              selectedAccountIds={selectedAccountIds}
              onChange={setSelectedAccountIds}
            />
          }
        />
      </motion.div>
      <TradeDrawer
        date={selectedDate}
        accountIds={selectedAccountIds}
        onClose={() => setSelectedDate(null)}
        onTradeSelect={handleTradeSelect}
      />
    </AppLayout>
  )
}
