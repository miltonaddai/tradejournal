import { create } from 'zustand'
import { api, type Trade } from '@/lib/api'
import { accountIdsKey, isStale } from './utils'

interface TradesState {
  tradesByKey: Record<string, { data: Trade[]; fetchedAt: number }>
  tradeById: Record<string, { data: Trade; fetchedAt: number }>
  loadingTradeKey: string | null
  fetchTradesForDay: (
    date: string,
    accountIds: string[],
    options?: { force?: boolean }
  ) => Promise<Trade[]>
  fetchTradeDetail: (
    tradeId: string,
    options?: { force?: boolean }
  ) => Promise<{ trade: Trade; dayTrades: Trade[] }>
  invalidate: () => void
  reset: () => void
}

const initialState = {
  tradesByKey: {} as Record<string, { data: Trade[]; fetchedAt: number }>,
  tradeById: {} as Record<string, { data: Trade; fetchedAt: number }>,
  loadingTradeKey: null as string | null,
}

export function tradesKey(date: string, accountIds: string[]) {
  return `${date}:${accountIdsKey(accountIds)}`
}

export const useTradesStore = create<TradesState>((set, get) => ({
  ...initialState,
  fetchTradesForDay: async (date, accountIds, { force } = {}) => {
    const key = tradesKey(date, accountIds)
    const cached = get().tradesByKey[key]

    if (!force && cached && !isStale(cached.fetchedAt)) {
      return cached.data
    }

    if (!cached) {
      set({ loadingTradeKey: key })
    }

    try {
      const data = await api.trades.list({ date, accountIds })
      set((state) => ({
        tradesByKey: {
          ...state.tradesByKey,
          [key]: { data, fetchedAt: Date.now() },
        },
        loadingTradeKey: state.loadingTradeKey === key ? null : state.loadingTradeKey,
      }))
      return data
    } catch {
      set((state) => ({
        tradesByKey: {
          ...state.tradesByKey,
          [key]: { data: [], fetchedAt: Date.now() },
        },
        loadingTradeKey: state.loadingTradeKey === key ? null : state.loadingTradeKey,
      }))
      return []
    }
  },
  fetchTradeDetail: async (tradeId, { force } = {}) => {
    const cachedTrade = get().tradeById[tradeId]

    if (!force && cachedTrade && !isStale(cachedTrade.fetchedAt)) {
      const accountIds = cachedTrade.data.account_id ? [cachedTrade.data.account_id] : []
      const dayTrades = get().tradesByKey[tradesKey(cachedTrade.data.date, accountIds)]?.data
      if (dayTrades) {
        return { trade: cachedTrade.data, dayTrades }
      }
    }

    if (!cachedTrade) set({ loadingTradeKey: tradeId })

    try {
      const trade =
        cachedTrade && !force ? cachedTrade.data : await api.trades.get(tradeId)

      const accountIds = trade.account_id ? [trade.account_id] : []
      const dayTrades = await get().fetchTradesForDay(trade.date, accountIds, { force })

      set((state) => ({
        tradeById: {
          ...state.tradeById,
          [tradeId]: { data: trade, fetchedAt: Date.now() },
        },
        loadingTradeKey: state.loadingTradeKey === tradeId ? null : state.loadingTradeKey,
      }))

      return { trade, dayTrades }
    } catch (error) {
      set((state) => ({
        loadingTradeKey: state.loadingTradeKey === tradeId ? null : state.loadingTradeKey,
      }))
      throw error
    }
  },
  invalidate: () =>
    set({
      tradesByKey: {},
      tradeById: {},
      loadingTradeKey: null,
    }),
  reset: () => set(initialState),
}))
