import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { AppLayout } from '@/components/layout/Sidebar'
import { GlassCard } from '@/components/layout/GlassCard'
import { Button } from '@/components/ui/button'
import { CreateStrategyModal } from '@/components/strategies/CreateStrategyModal'
import { StrategyDrawer } from '@/components/strategies/StrategyDrawer'
import { StrategyTipsPanel } from '@/components/strategies/StrategyTipsPanel'
import type { StrategyMarker } from '@/components/strategies/StrategyFormFields'
import { api, type Strategy } from '@/lib/api'
import { useStrategiesStore } from '@/stores'

function StrategyMarkerBadge({ marker }: { marker?: StrategyMarker }) {
  if (!marker) return null

  if (marker.type === 'emoji') {
    return <span className="text-lg">{marker.value}</span>
  }

  return (
    <span
      className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white/20"
      style={{ backgroundColor: marker.value }}
    />
  )
}

export function StrategiesPage() {
  const strategies = useStrategiesStore((state) => state.strategies)
  const loadError = useStrategiesStore((state) => state.error)
  const loading = useStrategiesStore((state) => state.loading)
  const fetchStrategies = useStrategiesStore((state) => state.fetchStrategies)
  const addStrategy = useStrategiesStore((state) => state.addStrategy)
  const updateStrategy = useStrategiesStore((state) => state.updateStrategy)

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null)

  useEffect(() => {
    fetchStrategies()
  }, [fetchStrategies])

  const handleCreate = async (payload: {
    name: string
    asset?: string
    entry_criteria: string[]
    exit_criteria: string[]
    other_rules: string[]
    marker?: StrategyMarker
  }) => {
    try {
      const created = await api.strategies.create(payload)
      addStrategy(created)
    } catch {
      const strategy: Strategy = {
        id: crypto.randomUUID(),
        name: payload.name,
        created_at: new Date().toISOString(),
        rules: {
          asset: payload.asset,
          entry_criteria: payload.entry_criteria,
          exit_criteria: payload.exit_criteria,
          other_rules: payload.other_rules,
          marker: payload.marker,
        },
      }
      addStrategy(strategy)
    }
  }

  const handleStrategyUpdate = (updated: Strategy) => {
    updateStrategy(updated)
    setSelectedStrategy((current) => (current?.id === updated.id ? updated : current))
  }

  const isEmpty = strategies.length === 0 && !loading

  return (
    <AppLayout>
      <h1 className="mb-8 text-2xl font-body">Strategies</h1>

      {loadError && (
        <div className="mb-6 max-w-2xl rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/60">
          <p>{loadError}</p>
        </div>
      )}

      <div className="flex flex-col gap-12 lg:grid lg:min-h-[calc(100vh-10rem)] lg:grid-cols-[1fr_auto_1fr] lg:gap-0">
        <div className="min-w-0 lg:pr-14">
          {loading && strategies.length === 0 ? (
            <p className="text-sm text-white/45">Loading strategies…</p>
          ) : isEmpty ? (
            <div className="flex min-h-[calc(100vh-14rem)] flex-col items-center justify-center lg:min-h-0 lg:items-start lg:justify-start">
              <Button size="lg" className="gap-2" onClick={() => setModalOpen(true)}>
                <Plus className="h-5 w-5" />
                Create your first strategy
              </Button>
            </div>
          ) : (
            <>
              <Button className="mb-8 w-full max-w-md" onClick={() => setModalOpen(true)}>
                Create Strategies
              </Button>

              <div className="flex max-w-2xl flex-col gap-3">
                {strategies.map((strategy, i) => (
                  <motion.div
                    key={strategy.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedStrategy(strategy)}
                      className="w-full text-left"
                    >
                      <GlassCard
                        variant="pill"
                        className="flex w-full items-center gap-3 !rounded-lg px-6 py-4 transition-colors hover:bg-white/[0.08]"
                      >
                        <StrategyMarkerBadge marker={strategy.rules?.marker} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm">{strategy.name}</p>
                          {strategy.rules?.asset && (
                            <p className="truncate text-xs text-white/45">{strategy.rules.asset}</p>
                          )}
                        </div>
                        <span className="shrink-0 text-xs text-white/35">
                          {strategy.rules?.entry_criteria?.length ?? 0} entry ·{' '}
                          {strategy.rules?.exit_criteria?.length ?? 0} exit ·{' '}
                          {strategy.rules?.other_rules?.length ?? 0} rules
                        </span>
                      </GlassCard>
                    </button>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="section-divider lg:hidden" aria-hidden />

        <div className="vertical-divider hidden lg:block" aria-hidden />

        <div className="flex min-w-0 items-center justify-center lg:pl-14">
          <StrategyTipsPanel />
        </div>
      </div>

      <CreateStrategyModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreate={handleCreate}
      />

      <StrategyDrawer
        strategy={selectedStrategy}
        onClose={() => setSelectedStrategy(null)}
        onUpdate={handleStrategyUpdate}
      />
    </AppLayout>
  )
}
