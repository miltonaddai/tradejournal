import { Router } from 'express'
import { z } from 'zod'
import { localUser } from '../middleware/localUser.js'
import { getLocalUser, now, save } from '../db/store.js'

const router = Router()

const profileUpdateSchema = z.object({
  display_name: z.string().max(100).nullable().optional(),
  avatar_url: z.string().url().max(2048).nullable().optional(),
})

router.get('/me', localUser, (_req, res) => {
  res.json(getLocalUser())
})

router.patch('/me', localUser, (req, res) => {
  const parsed = profileUpdateSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid profile update' })
  }

  const user = getLocalUser()
  if (parsed.data.display_name !== undefined) user.display_name = parsed.data.display_name
  if (parsed.data.avatar_url !== undefined) user.avatar_url = parsed.data.avatar_url
  user.updated_at = now()
  save()

  res.json(user)
})

export default router
