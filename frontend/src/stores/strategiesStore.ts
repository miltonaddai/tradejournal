import { create } from 'zustand'
import { api, type Strategy } from '@/lib/api'
import { isStale } from './utils'

interface StrategiesState {
  strategies: Strategy[]
  loading: boolean
  error: string | null
  fetchedAt: number | null
  fetchStrategies: (options?: { force?: boolean }) => Promise<void>
  addStrategy: (strategy: Strategy) => void
  updateStrategy: (strategy: Strategy) => void
  reset: () => void
}

const initialState = {
  strategies: [] as Strategy[],
  loading: false,
  error: null as string | null,
  fetchedAt: null as number | null,
}

export const useStrategiesStore = create<StrategiesState>((set, get) => ({
  ...initialState,
  fetchStrategies: async ({ force } = {}) => {
    const { strategies, fetchedAt, loading } = get()
    if (loading) return
    const hasData = strategies.length > 0
    if (!force && hasData && !isStale(fetchedAt)) return

    if (!hasData) {
      set({ loading: true, error: null })
    }

    try {
      const items = await api.strategies.list()
      set({ strategies: items, loading: false, error: null, fetchedAt: Date.now() })
    } catch (error) {
      set({
        strategies: [],
        loading: false,
        error: error instanceof Error ? error.message : 'Unable to load strategies.',
        fetchedAt: null,
      })
    }
  },
  addStrategy: (strategy) =>
    set((state) => ({
      strategies: [strategy, ...state.strategies],
      fetchedAt: Date.now(),
    })),
  updateStrategy: (strategy) =>
    set((state) => ({
      strategies: state.strategies.map((item) => (item.id === strategy.id ? strategy : item)),
      fetchedAt: Date.now(),
    })),
  reset: () => set(initialState),
}))
