import { Router } from 'express'
import { z } from 'zod'
import { localUser, type AppRequest } from '../middleware/localUser.js'
import { db } from '../db/store.js'
import { findOrCreateAccount } from '../lib/importService.js'

const router = Router()

const accountSchema = z.object({
  name: z.string().trim().min(1),
  source: z.enum(['csv', 'broker']).optional(),
})

router.get('/', localUser, (req: AppRequest, res) => {
  const accounts = db.accounts
    .filter((account) => account.user_id === req.userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
  res.json(accounts)
})

router.post('/', localUser, (req: AppRequest, res) => {
  const parsed = accountSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid account' })
  }

  res.json(findOrCreateAccount(req.userId!, parsed.data.name, parsed.data.source ?? 'csv'))
})

export default router
