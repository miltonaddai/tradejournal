import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  CriteriaField,
  StrategyMarkerPicker,
  type StrategyMarker,
} from '@/components/strategies/StrategyFormFields'

const modalEase = [0.22, 1, 0.36, 1] as const

export interface CreateStrategyPayload {
  name: string
  asset?: string
  entry_criteria: string[]
  exit_criteria: string[]
  other_rules: string[]
  marker?: StrategyMarker
}

interface CreateStrategyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (payload: CreateStrategyPayload) => void
}

export function CreateStrategyModal({ open, onOpenChange, onCreate }: CreateStrategyModalProps) {
  const [name, setName] = useState('')
  const [asset, setAsset] = useState('')
  const [entryCriteria, setEntryCriteria] = useState<string[]>([])
  const [exitCriteria, setExitCriteria] = useState<string[]>([])
  const [otherRules, setOtherRules] = useState<string[]>([])
  const [marker, setMarker] = useState<StrategyMarker | undefined>({
    type: 'color',
    value: '#14b8a6',
  })
  const [error, setError] = useState('')

  const resetForm = () => {
    setName('')
    setAsset('')
    setEntryCriteria([])
    setExitCriteria([])
    setOtherRules([])
    setMarker({ type: 'color', value: '#14b8a6' })
    setError('')
  }

  const handleClose = () => {
    onOpenChange(false)
    resetForm()
  }

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Strategy name is required.')
      return
    }

    onCreate({
      name: name.trim(),
      asset: asset.trim() || undefined,
      entry_criteria: [...entryCriteria],
      exit_criteria: [...exitCriteria],
      other_rules: [...otherRules],
      marker,
    })
    handleClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="create-strategy-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: modalEase }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            key="create-strategy-panel"
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.4, ease: modalEase }}
            className="glass-dark fixed top-1/2 left-1/2 z-50 max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl p-8 shadow-xl"
          >
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-4 right-4 rounded-full p-1 text-white/60 transition-colors hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="mb-6 pr-8 text-lg font-body font-semibold">Create Strategy</h2>

            <div className="space-y-6">
              <div>
                <Label htmlFor="strategy-name">Strategy name</Label>
                <Input
                  id="strategy-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Opening Range Breakout"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="strategy-asset">Asset (optional)</Label>
                <Input
                  id="strategy-asset"
                  value={asset}
                  onChange={(e) => setAsset(e.target.value)}
                  placeholder="e.g. AAPL, ES, BTC"
                  className="mt-2"
                />
              </div>

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

              <StrategyMarkerPicker value={marker} onChange={setMarker} />

              {error && <p className="text-sm text-loss">{error}</p>}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="button" className="flex-1" onClick={handleSubmit}>
                  Create Strategy
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
