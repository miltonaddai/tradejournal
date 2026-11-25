import { create } from 'zustand'
import { api, type CalendarDay, type DashboardStats } from '@/lib/api'
import { accountIdsKey, isStale } from './utils'

interface CacheEntry<T> {
  data: T
  fetchedAt: number
}

interface DashboardState {
  selectedAccountIds: string[]
  currentMonthKey: string | null
  calendarByKey: Record<string, CacheEntry<CalendarDay[]>>
  statsByKey: Record<string, CacheEntry<DashboardStats>>
  loadingCalendar: boolean
  loadingStats: boolean
  setSelectedAccountIds: (ids: string[]) => void
  setCurrentMonthKey: (monthKey: string) => void
  fetchDashboard: (monthKey: string, accountIds: string[], options?: { force?: boolean }) => Promise<void>
  fetchCalendarMonth: (monthKey: string, options?: { force?: boolean }) => Promise<CalendarDay[]>
  invalidate: () => void
  reset: () => void
}

const emptyStats: DashboardStats = {
  total_profit: 0,
  trade_winrate: 0,
  profit_factor: 0,
  avg_rr: '0:0',
  day_winrate: 0,
}

const initialState = {
  selectedAccountIds: [] as string[],
  currentMonthKey: null as string | null,
  calendarByKey: {} as Record<string, CacheEntry<CalendarDay[]>>,
  statsByKey: {} as Record<string, CacheEntry<DashboardStats>>,
  loadingCalendar: false,
  loadingStats: false,
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  ...initialState,
  setSelectedAccountIds: (ids) => set({ selectedAccountIds: ids }),
  setCurrentMonthKey: (monthKey) => set({ currentMonthKey: monthKey }),
  fetchDashboard: async (monthKey, accountIds, { force } = {}) => {
    const calendarKey = `${monthKey}:${accountIdsKey(accountIds)}`
    const statsKey = accountIdsKey(accountIds)
    const { calendarByKey, statsByKey } = get()

    const cachedCalendar = calendarByKey[calendarKey]
    const cachedStats = statsByKey[statsKey]
    const hasCalendar = Boolean(cachedCalendar)
    const hasStats = Boolean(cachedStats)
    const calendarFresh = cachedCalendar && !isStale(cachedCalendar.fetchedAt)
    const statsFresh = cachedStats && !isStale(cachedStats.fetchedAt)

    if (!force && calendarFresh && statsFresh) {
      return
    }

    if (accountIds.length === 0) {
      set({
        calendarByKey: {
          ...calendarByKey,
          [calendarKey]: { data: [], fetchedAt: Date.now() },
        },
        statsByKey: {
          ...statsByKey,
          [statsKey]: { data: emptyStats, fetchedAt: Date.now() },
        },
        loadingCalendar: false,
        loadingStats: false,
      })
      return
    }

    set({
      loadingCalendar: !hasCalendar,
      loadingStats: !hasStats,
      currentMonthKey: monthKey,
    })

    try {
      const [calendar, stats] = await Promise.all([
        api.trades.calendar(monthKey, accountIds),
        api.trades.stats(accountIds),
      ])

      set((state) => ({
        calendarByKey: {
          ...state.calendarByKey,
          [calendarKey]: { data: calendar, fetchedAt: Date.now() },
        },
        statsByKey: {
          ...state.statsByKey,
          [statsKey]: { data: stats, fetchedAt: Date.now() },
        },
        loadingCalendar: false,
        loadingStats: false,
      }))
    } catch {
      set({ loadingCalendar: false, loadingStats: false })
    }
  },
  fetchCalendarMonth: async (monthKey, { force } = {}) => {
    const calendarKey = monthKey
    const { calendarByKey } = get()
    const cached = calendarByKey[calendarKey]

    if (!force && cached && !isStale(cached.fetchedAt)) {
      return cached.data
    }

    const data = await api.trades.calendar(monthKey).catch(() => [] as CalendarDay[])
    set((state) => ({
      calendarByKey: {
        ...state.calendarByKey,
        [calendarKey]: { data, fetchedAt: Date.now() },
      },
    }))
    return data
  },
  invalidate: () =>
    set((state) => ({
      calendarByKey: {},
      statsByKey: {},
      loadingCalendar: false,
      loadingStats: false,
      selectedAccountIds: state.selectedAccountIds,
      currentMonthKey: state.currentMonthKey,
    })),
  reset: () => set(initialState),
}))
