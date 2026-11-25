import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * A tiny JSON-file data store. Every table is an array kept in memory and
 * flushed to disk atomically after each write. It needs no external services,
 * which keeps the app runnable in an offline sandbox.
 *
 * Set DATA_FILE=":memory:" to keep everything in memory (handy for tests).
 */

export interface UserRow {
  id: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface AccountRow {
  id: string
  user_id: string
  name: string
  source: 'csv' | 'broker'
  created_at: string
}

export interface TradeRow {
  id: string
  user_id: string
  account_id: string | null
  asset: string
  side: 'long' | 'short'
  entry_time: string
  exit_time: string | null
  entry_price: number
  exit_price: number | null
  pnl: number
  date: string
  created_at: string
}

export interface JournalEntryRow {
  id: string
  user_id: string
  date: string
  content: string
  created_at: string
  updated_at: string
}

export interface StrategyRow {
  id: string
  user_id: string
  name: string
  description: string | null
  rules: unknown
  created_at: string
}

export interface Database {
  users: UserRow[]
  accounts: AccountRow[]
  trades: TradeRow[]
  journal_entries: JournalEntryRow[]
  strategies: StrategyRow[]
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const defaultDataFile = path.resolve(__dirname, '../../data/db.json')

function emptyDatabase(): Database {
  return {
    users: [],
    accounts: [],
    trades: [],
    journal_entries: [],
    strategies: [],
  }
}

function resolveDataFile() {
  const configured = process.env.DATA_FILE?.trim()
  if (configured === ':memory:') return null
  return configured ? path.resolve(configured) : defaultDataFile
}

const dataFile = resolveDataFile()

function load(): Database {
  if (!dataFile || !fs.existsSync(dataFile)) return emptyDatabase()
  const parsed = JSON.parse(fs.readFileSync(dataFile, 'utf8')) as Partial<Database> & {
    sessions?: unknown
    wallets?: unknown
  }
  // Drop tables written by older versions (login sessions, wallet tracking).
  const { sessions: _sessions, wallets: _wallets, ...tables } = parsed
  return { ...emptyDatabase(), ...tables }
}

export const db: Database = load()

/** Persist the current state to disk (no-op for the in-memory store). */
export function save() {
  if (!dataFile) return
  fs.mkdirSync(path.dirname(dataFile), { recursive: true })
  const tempFile = `${dataFile}.tmp`
  fs.writeFileSync(tempFile, JSON.stringify(db, null, 2))
  fs.renameSync(tempFile, dataFile)
}

export function getDataFileLabel() {
  return dataFile ?? 'in-memory'
}

export function now() {
  return new Date().toISOString()
}

export const LOCAL_USER_ID = 'local-user'

/** The single built-in user that owns all data. Created on first use. */
export function getLocalUser(): UserRow {
  const existing = db.users.find((user) => user.id === LOCAL_USER_ID)
  if (existing) return existing

  const timestamp = now()
  const user: UserRow = {
    id: LOCAL_USER_ID,
    display_name: null,
    avatar_url: null,
    created_at: timestamp,
    updated_at: timestamp,
  }
  db.users.push(user)
  save()
  return user
}
