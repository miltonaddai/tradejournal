import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { localUser, type AppRequest } from '../middleware/localUser.js'
import { db, now, save } from '../db/store.js'

const router = Router()

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

const entrySchema = z.object({
  date: dateSchema,
  content: z.string(),
})

router.get('/', localUser, (req: AppRequest, res) => {
  const date = dateSchema.safeParse(req.query.date)
  if (!date.success) return res.status(400).json({ message: 'Date required (YYYY-MM-DD)' })

  const entry = db.journal_entries.find(
    (item) => item.user_id === req.userId && item.date === date.data
  )
  res.json(entry ?? { id: null, date: date.data, content: '' })
})

router.post('/', localUser, (req: AppRequest, res) => {
  const parsed = entrySchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid entry' })
  }

  const { date, content } = parsed.data
  const timestamp = now()
  let entry = db.journal_entries.find((item) => item.user_id === req.userId && item.date === date)

  if (entry) {
    entry.content = content
    entry.updated_at = timestamp
  } else {
    entry = {
      id: randomUUID(),
      user_id: req.userId!,
      date,
      content,
      created_at: timestamp,
      updated_at: timestamp,
    }
    db.journal_entries.push(entry)
  }

  save()
  res.json(entry)
})

export default router
