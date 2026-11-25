export const CACHE_TTL_MS = 60_000

export function isStale(fetchedAt: number | null, ttl = CACHE_TTL_MS) {
  if (fetchedAt === null) return true
  return Date.now() - fetchedAt > ttl
}

export function accountIdsKey(ids: string[]) {
  return [...ids].sort().join(',')
}
