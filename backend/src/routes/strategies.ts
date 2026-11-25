import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { localUser, type AppRequest } from '../middleware/localUser.js'
import { db, now, save, type StrategyRow } from '../db/store.js'
import { buildStrategyRules, formatStrategyRow, normalizeStrategyRules } from '../lib/strategyRules.js'

const router = Router()

const markerSchema = z.object({
  type: z.enum(['color', 'emoji']),
  value: z.string(),
})

const rulesSchema = z.object({
  asset: z.string().optional(),
  entry_criteria: z.array(z.string()).default([]),
  exit_criteria: z.array(z.string()).default([]),
  other_rules: z.array(z.string()).default([]),
  marker: markerSchema.optional(),
})

const strategySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  rules: rulesSchema.optional(),
})

const updateSchema = z.object({
  description: z.string().optional(),
  notes: z.string().optional(),
  rules: z
    .object({
      entry_criteria: z.array(z.string()).optional(),
      exit_criteria: z.array(z.string()).optional(),
      other_rules: z.array(z.string()).optional(),
    })
    .optional(),
})

function toResponse(row: StrategyRow) {
  const { user_id: _userId, ...rest } = row
  return formatStrategyRow(rest)
}

router.get('/', localUser, (req: AppRequest, res) => {
  const strategies = db.strategies
    .filter((strategy) => strategy.user_id === req.userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
  res.json(strategies.map(toResponse))
})

router.post('/', localUser, (req: AppRequest, res) => {
  const parsed = strategySchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid strategy' })
  }

  const strategy: StrategyRow = {
    id: randomUUID(),
    user_id: req.userId!,
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    rules: buildStrategyRules(parsed.data.rules),
    created_at: now(),
  }
  db.strategies.push(strategy)
  save()

  res.json(toResponse(strategy))
})

router.patch('/:id', localUser, (req: AppRequest, res) => {
  const parsed = updateSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid update' })
  }

  const strategy = db.strategies.find(
    (item) => item.id === req.params.id && item.user_id === req.userId
  )
  if (!strategy) {
    return res.status(404).json({ message: 'Strategy not found' })
  }

  const description = parsed.data.description ?? parsed.data.notes
  const rulesPatch = parsed.data.rules

  if (description !== undefined) strategy.description = description
  if (rulesPatch) {
    const definedPatch = Object.fromEntries(
      Object.entries(rulesPatch).filter(([, value]) => value !== undefined)
    )
    strategy.rules = { ...normalizeStrategyRules(strategy.rules), ...definedPatch }
  }

  if (description !== undefined || rulesPatch) save()
  res.json(toResponse(strategy))
})

export default router
