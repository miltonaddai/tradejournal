import { create } from 'zustand'
import { api, type Account } from '@/lib/api'
import { isStale } from './utils'

interface AccountsState {
  accounts: Account[]
  loading: boolean
  error: string | null
  fetchedAt: number | null
  fetchAccounts: (options?: { force?: boolean }) => Promise<void>
  addAccount: (account: Account) => void
  reset: () => void
}

const initialState = {
  accounts: [] as Account[],
  loading: false,
  error: null as string | null,
  fetchedAt: null as number | null,
}

export const useAccountsStore = create<AccountsState>((set, get) => ({
  ...initialState,
  fetchAccounts: async ({ force } = {}) => {
    const { accounts, fetchedAt, loading } = get()
    if (loading) return
    const hasData = accounts.length > 0
    if (!force && hasData && !isStale(fetchedAt)) return

    if (!hasData) {
      set({ loading: true, error: null })
    }

    try {
      const items = await api.accounts.list()
      set({ accounts: items, loading: false, error: null, fetchedAt: Date.now() })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load accounts'
      set({ loading: false, error: message })
    }
  },
  addAccount: (account) =>
    set((state) => ({
      accounts: [account, ...state.accounts.filter((item) => item.id !== account.id)],
      fetchedAt: Date.now(),
    })),
  reset: () => set(initialState),
}))
