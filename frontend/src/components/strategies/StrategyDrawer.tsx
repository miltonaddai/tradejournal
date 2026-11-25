import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check } from 'lucide-react'
import type { Strategy } from '@/lib/api'
import { api } from '@/lib/api'
import { CriteriaField } from '@/components/strategies/StrategyFormFields'
import type { StrategyMarker } from '@/components/strategies/StrategyFormFields'
import { cn } from '@/lib/utils'

const drawerEase = [0.22, 1, 0.36, 1] as const

function arraysEqual(a: string[], b: string[]) {
  return a.length === b.length && a.every((value, index) => value === b[index])
}

interface StrategySnapshot {
  notes: string
  entryCriteria: string[]
  exitCriteria: string[]
  otherRules: string[]
}

function StrategyMarkerBadge({ marker, large }: { marker?: StrategyMarker; large?: boolean }) {
  if (!marker) return null

  if (marker.type === 'emoji') {
    return <span className={cn(large ? 'text-3xl' : 'text-lg')}>{marker.value}</span>
  }

  return (
    <span
      className={cn(
        'shrink-0 rounded-full ring-2 ring-white/20',
        large ? 'h-5 w-5' : 'h-3 w-3'
      )}
      style={{ backgroundColor: marker.value }}
    />
  )
}

interface StrategyDrawerProps {
  strategy: Strategy | null
  onClose: () => void
  onUpdate: (strategy: Strategy) => void
}

export function StrategyDrawer({ strategy, onClose, onUpdate }: StrategyDrawerProps) {
  const [notes, setNotes] = useState('')
  const [entryCriteria, setEntryCriteria] = useState<string[]>([])
  const [exitCriteria, setExitCriteria] = useState<string[]>([])
  const [otherRules, setOtherRules] = useState<string[]>([])
  const [savedSnapshot, setSavedSnapshot] = useState<StrategySnapshot | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!strategy) {
      setSavedSnapshot(null)
      return
    }

    const snapshot: StrategySnapshot = {
      notes: strategy.description ?? '',
      entryCriteria: strategy.rules?.entry_criteria ?? [],
      exitCriteria: strategy.rules?.exit_criteria ?? [],
      otherRules: strategy.rules?.other_rules ?? [],
    }

    setNotes(snapshot.notes)
    setEntryCriteria(snapshot.entryCriteria)
    setExitCriteria(snapshot.exitCriteria)
    setOtherRules(snapshot.otherRules)
    setSavedSnapshot(snapshot)
  }, [strategy?.id])

  const isDirty =
    savedSnapshot !== null &&
    (notes !== savedSnapshot.notes ||
      !arraysEqual(entryCriteria, savedSnapshot.entryCriteria) ||
      !arraysEqual(exitCriteria, savedSnapshot.exitCriteria) ||
      !arraysEqual(otherRules, savedSnapshot.otherRules))

  const handleSave = async () => {
    if (!strategy || !isDirty || saving) return

    setSaving(true)

    const payload = {
      notes,
      entry_criteria: entryCriteria,
      exit_criteria: exitCriteria,
      other_rules: otherRules,
    }

    try {
      const updated = await api.strategies.update(strategy.id, payload)
      onUpdate(updated)
      setSavedSnapshot({
        notes,
        entryCriteria,
        exitCriteria,
        otherRules,
      })
      onClose()
    } catch {
      onUpdate({
        ...strategy,
        description: notes,
        rules: {
          ...strategy.rules,
          entry_criteria: entryCriteria,
          exit_criteria: exitCriteria,
          other_rules: otherRules,
        },
      })
      setSavedSnapshot({
        notes,
        entryCriteria,
        exitCriteria,
        otherRules,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const rules = strategy?.rules

  return (
    <AnimatePresence>
      {strategy && (
        <>
          <motion.div
            key="strategy-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: drawerEase }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="strategy-drawer-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.4, ease: drawerEase }}
            className="fixed top-0 right-0 z-50 flex h-full w-full max-w-3xl flex-col border-l border-white/10 bg-[#0d0d0d]/95 backdrop-blur-xl"
          >
            <div className="flex flex-1 flex-col overflow-y-auto p-8">
              <div className="flex items-start gap-4">
                <StrategyMarkerBadge marker={rules?.marker} large />
                <div className="min-w-0 flex-1">
                  <h2 className="text-2xl font-body font-semibold">{strategy.name}</h2>
                  {rules?.asset && (
                    <p className="mt-1 text-sm text-white/50">{rules.asset}</p>
                  )}
                </div>
                {isDirty && (
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="shrink-0 p-1 text-white/70 transition-colors hover:text-white disabled:opacity-50"
                    aria-label="Save changes"
                  >
                    <Check className="h-5 w-5" />
                  </button>
                )}
              </div>

              <hr className="my-6 border-white/10" />

              <div className="space-y-6">
                <CriteriaField
                  label="Entry criteria"
                  values={entryCriteria}
                  onChange={setEntryCriteria}
                  placeholder="Add entry rule and press +"
                />
                <CriteriaField
                  label="Exit criteria"
                  values={exitCriteria}
                  onChange={setExitCriteria}
                  placeholder="Add exit rule and press +"
                />
                <CriteriaField
                  label="Rules"
                  values={otherRules}
                  onChange={setOtherRules}
                  placeholder="Add other rule and press +"
                />
              </div>

              <hr className="my-6 border-white/10" />

              <div className="flex min-h-0 flex-1 flex-col">
                <h3 className="mb-3 text-xs font-medium tracking-wide text-white/45 uppercase">
                  Notes
                </h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this strategy…"
                  className="glass-input min-h-[16rem] flex-1 resize-none"
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
