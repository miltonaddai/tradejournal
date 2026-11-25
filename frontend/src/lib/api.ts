const API_BASE = import.meta.env.VITE_API_URL || '/api'

async function parseErrorResponse(res: Response) {
  return res.json().catch(() => ({ message: res.statusText }))
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers,
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const error = await parseErrorResponse(res)
    throw new Error(error.message || 'Request failed')
  }
  return res.json()
}

function isStrategyMarker(value: unknown): value is StrategyMarker {
  if (!value || typeof value !== 'object') return false
  const marker = value as { type?: unknown; value?: unknown }
  return (
    (marker.type === 'color' || marker.type === 'emoji') &&
    typeof marker.value === 'string'
  )
}

function normalizeStrategyRules(rules: unknown): StrategyRules {
  if (typeof rules === 'string') {
    try {
      return normalizeStrategyRules(JSON.parse(rules))
    } catch {
      return { entry_criteria: [], exit_criteria: [], other_rules: [] }
    }
  }

  if (!rules || typeof rules !== 'object' || Array.isArray(rules)) {
    return { entry_criteria: [], exit_criteria: [], other_rules: [] }
  }

  const value = rules as Record<string, unknown>

  return {
    asset: typeof value.asset === 'string' ? value.asset : undefined,
    entry_criteria: Array.isArray(value.entry_criteria)
      ? value.entry_criteria.filter((item): item is string => typeof item === 'string')
      : [],
    exit_criteria: Array.isArray(value.exit_criteria)
      ? value.exit_criteria.filter((item): item is string => typeof item === 'string')
      : [],
    other_rules: Array.isArray(value.other_rules)
      ? value.other_rules.filter((item): item is string => typeof item === 'string')
      : [],
    marker: isStrategyMarker(value.marker) ? value.marker : undefined,
  }
}

function normalizeStrategy(strategy: Strategy): Strategy {
  return {
    ...strategy,
    rules: normalizeStrategyRules(strategy.rules),
  }
}

export const api = {
  trades: {
    list: (params?: { date?: string; accountIds?: string[] }) => {
      const query = new URLSearchParams()
      if (params?.date) query.set('date', params.date)
      if (params?.accountIds?.length) query.set('account_ids', params.accountIds.join(','))
      const suffix = query.toString()
      return request<Trade[]>('/trades' + (suffix ? `?${suffix}` : ''))
    },
    get: (id: string) => request<Trade>(`/trades/${id}`),
    import: async (file: File, options: { accountId?: string; accountName?: string }) => {
      const form = new FormData()
      form.append('file', file)
      if (options.accountId) form.append('accountId', options.accountId)
      if (options.accountName) form.append('accountName', options.accountName)

      const res = await fetch(`${API_BASE}/trades/import`, {
        method: 'POST',
        body: form,
      })

      const data = await res.json().catch(() => ({ message: res.statusText }))
      if (!res.ok) {
        throw new Error(data.message || 'Import failed')
      }
      return data as ImportResult
    },
    stats: (accountIds?: string[]) => {
      const query = accountIds?.length ? `?account_ids=${accountIds.join(',')}` : ''
      return request<DashboardStats>(`/trades/stats${query}`)
    },
    calendar: (month: string, accountIds?: string[]) => {
      const query = new URLSearchParams({ month })
      if (accountIds?.length) query.set('account_ids', accountIds.join(','))
      return request<CalendarDay[]>(`/trades/calendar?${query.toString()}`)
    },
  },
  accounts: {
    list: () => request<Account[]>('/accounts'),
    create: (name: string, source: Account['source'] = 'csv') =>
      request<Account>('/accounts', {
        method: 'POST',
        body: JSON.stringify({ name, source }),
      }),
  },
  journal: {
    get: (date: string) => request<JournalEntry>(`/journal?date=${date}`),
    save: (date: string, content: string) =>
      request<JournalEntry>('/journal', {
        method: 'POST',
        body: JSON.stringify({ date, content }),
      }),
  },
  strategies: {
    list: () => request<Strategy[]>('/strategies').then((items) => items.map(normalizeStrategy)),
    create: (payload: {
      name: string
      asset?: string
      entry_criteria?: string[]
      exit_criteria?: string[]
      other_rules?: string[]
      marker?: StrategyMarker
    }) =>
      request<Strategy>('/strategies', {
        method: 'POST',
        body: JSON.stringify({
          name: payload.name,
          rules: {
            asset: payload.asset,
            entry_criteria: payload.entry_criteria ?? [],
            exit_criteria: payload.exit_criteria ?? [],
            other_rules: payload.other_rules ?? [],
            marker: payload.marker,
          },
        }),
      }).then(normalizeStrategy),
    update: (
      id: string,
      payload: {
        notes?: string
        entry_criteria?: string[]
        exit_criteria?: string[]
        other_rules?: string[]
      }
    ) =>
      request<Strategy>(`/strategies/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          description: payload.notes,
          rules: {
            entry_criteria: payload.entry_criteria,
            exit_criteria: payload.exit_criteria,
            other_rules: payload.other_rules,
          },
        }),
      }).then(normalizeStrategy),
  },
  users: {
    getProfile: () => request<UserProfile>('/users/me'),
    updateProfile: (data: { display_name?: string | null; avatar_url?: string | null }) =>
      request<UserProfile>('/users/me', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },
}

export interface Trade {
  id: string
  asset: string
  entry_time: string
  exit_time?: string
  pnl: number
  side: 'long' | 'short'
  entry_price: number
  exit_price?: number
  date: string
  account_id?: string
}

export interface Account {
  id: string
  name: string
  source: 'csv' | 'broker'
  created_at: string
}

export interface ImportResult {
  message: string
  status: 'processing' | 'completed'
  trades_imported?: number
  account_id?: string
}

export interface DashboardStats {
  total_profit: number
  trade_winrate: number
  profit_factor: number
  avg_rr: string
  day_winrate: number
}

export interface CalendarDay {
  date: string
  pnl: number
  trade_count: number
  winrate?: number
}

export interface JournalEntry {
  id: string | null
  date: string
  content: string
}

export interface StrategyMarker {
  type: 'color' | 'emoji'
  value: string
}

export interface StrategyRules {
  asset?: string
  entry_criteria: string[]
  exit_criteria: string[]
  other_rules?: string[]
  marker?: StrategyMarker
}

export interface Strategy {
  id: string
  name: string
  description?: string
  rules?: StrategyRules
  created_at: string
}

export interface UserProfile {
  id: string
  display_name: string | null
  avatar_url?: string | null
  created_at?: string
  updated_at?: string
}
