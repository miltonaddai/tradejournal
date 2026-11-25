import { create } from 'zustand'
import { api, type UserProfile } from '@/lib/api'
import { isStale } from './utils'

interface UserState {
  profile: UserProfile | null
  loading: boolean
  error: string | null
  fetchedAt: number | null
  fetchUser: (options?: { force?: boolean }) => Promise<void>
  setProfile: (profile: UserProfile) => void
  reset: () => void
}

const initialState = {
  profile: null as UserProfile | null,
  loading: false,
  error: null as string | null,
  fetchedAt: null as number | null,
}

export const useUserStore = create<UserState>((set, get) => ({
  ...initialState,
  fetchUser: async ({ force } = {}) => {
    const { profile, fetchedAt, loading } = get()
    if (loading) return
    const hasData = profile !== null
    if (!force && hasData && !isStale(fetchedAt)) return

    if (!hasData) {
      set({ loading: true, error: null })
    }

    try {
      const profileData = await api.users.getProfile()
      set({
        profile: profileData,
        loading: false,
        error: null,
        fetchedAt: Date.now(),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load settings'
      set({ loading: false, error: message })
    }
  },
  setProfile: (profile) => set({ profile, fetchedAt: Date.now() }),
  reset: () => set(initialState),
}))
