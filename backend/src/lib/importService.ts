import { randomUUID } from 'node:crypto'
import { db, now, save, type AccountRow, type TradeRow } from '../db/store.js'
import { parseTradesCsv } from './parseCsv.js'

export function findOrCreateAccount(
  userId: string,
  name: string,
  source: AccountRow['source'] = 'csv'
): AccountRow {
  const trimmed = name.trim()
  const existing = db.accounts.find(
    (account) => account.user_id === userId && account.name === trimmed
  )
  if (existing) return existing

  const account: AccountRow = {
    id: randomUUID(),
    user_id: userId,
    name: trimmed,
    source,
    created_at: now(),
  }
  db.accounts.push(account)
  save()
  return account
}

export function resolveAccountId(
  userId: string,
  options: { accountId?: string; accountName?: string }
) {
  if (options.accountId) {
    const owned = db.accounts.find(
      (account) => account.id === options.accountId && account.user_id === userId
    )
    if (owned) return owned.id
  }

  const accountName = options.accountName?.trim()
  if (!accountName) {
    throw new Error('Account name is required')
  }

  return findOrCreateAccount(userId, accountName).id
}

export function importTradesFromCsv(
  userId: string,
  csvContent: string,
  options: { accountId?: string; accountName?: string }
) {
  const accountId = resolveAccountId(userId, options)
  const { trades, rowCount } = parseTradesCsv(csvContent, userId, accountId)

  if (trades.length === 0) {
    throw new Error('No valid trades found in CSV. Include at least symbol/asset and date columns.')
  }

  const createdAt = now()
  const rows: TradeRow[] = trades.map((trade) => ({
    id: randomUUID(),
    created_at: createdAt,
    ...trade,
  }))

  db.trades.push(...rows)
  save()

  return {
    imported: rowCount,
    account_id: accountId,
  }
}
