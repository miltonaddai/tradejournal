/**
 * Loads the sample CSV trades into the local data store.
 *
 *   yarn seed
 *
 * Re-running is safe: existing data is cleared first.
 */
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { db, getDataFileLabel, getLocalUser, save } from './db/store.js'
import { importTradesFromCsv } from './lib/importService.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sampleCsv = path.resolve(__dirname, '../../examples/sample-trades.csv')

db.accounts = []
db.trades = []
db.journal_entries = []
db.strategies = []
save()

const user = getLocalUser()
const result = importTradesFromCsv(user.id, fs.readFileSync(sampleCsv, 'utf8'), {
  accountName: 'Sample Futures Account',
})

console.log(`Seeded ${getDataFileLabel()} with ${result.imported} sample trades`)
