import { create } from 'zustand'
import { api } from '@/lib/api'
import { isStale } from './utils'

interface JournalState {
  entriesByDate: Record<string, { content: string; fetchedAt: number }>
  loadingDate: string | null
  fetchEntry: (date: string, options?: { force?: boolean }) => Promise<string>
  setEntry: (date: string, content: string) => void
  reset: () => void
}

const initialState = {
  entriesByDate: {} as Record<string, { content: string; fetchedAt: number }>,
  loadingDate: null as string | null,
}

export const useJournalStore = create<JournalState>((set, get) => ({
  ...initialState,
  fetchEntry: async (date, { force } = {}) => {
    const cached = get().entriesByDate[date]
    if (!force && cached && !isStale(cached.fetchedAt)) {
      return cached.content
    }

    if (!cached) {
      set({ loadingDate: date })
    }

    try {
      const entry = await api.journal.get(date)
      const content = entry.content || ''
      set((state) => ({
        entriesByDate: {
          ...state.entriesByDate,
          [date]: { content, fetchedAt: Date.now() },
        },
        loadingDate: state.loadingDate === date ? null : state.loadingDate,
      }))
      return content
    } catch {
      set((state) => ({
        entriesByDate: {
          ...state.entriesByDate,
          [date]: { content: '', fetchedAt: Date.now() },
        },
        loadingDate: state.loadingDate === date ? null : state.loadingDate,
      }))
      return ''
    }
  },
  setEntry: (date, content) =>
    set((state) => ({
      entriesByDate: {
        ...state.entriesByDate,
        [date]: { content, fetchedAt: Date.now() },
      },
    })),
  reset: () => set(initialState),
}))
