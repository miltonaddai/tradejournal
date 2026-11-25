type ParsedRules = {
  asset?: string
  entry_criteria?: string[]
  exit_criteria?: string[]
  other_rules?: string[]
  marker?: { type: 'color' | 'emoji'; value: string }
}

export interface StrategyRules {
  asset?: string
  entry_criteria: string[]
  exit_criteria: string[]
  other_rules: string[]
  marker?: { type: 'color' | 'emoji'; value: string }
}

function isMarker(value: unknown): value is StrategyRules['marker'] {
  if (!value || typeof value !== 'object') return false
  const marker = value as { type?: unknown; value?: unknown }
  return (
    (marker.type === 'color' || marker.type === 'emoji') &&
    typeof marker.value === 'string'
  )
}

export function buildStrategyRules(rules?: ParsedRules | null): StrategyRules {
  return {
    asset: rules?.asset,
    entry_criteria: rules?.entry_criteria ?? [],
    exit_criteria: rules?.exit_criteria ?? [],
    other_rules: rules?.other_rules ?? [],
    marker: isMarker(rules?.marker) ? rules?.marker : undefined,
  }
}

export function normalizeStrategyRules(raw: unknown): StrategyRules {
  if (typeof raw === 'string') {
    try {
      return normalizeStrategyRules(JSON.parse(raw))
    } catch {
      return buildStrategyRules()
    }
  }

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return buildStrategyRules()
  }

  const rules = raw as Record<string, unknown>

  return buildStrategyRules({
    asset: typeof rules.asset === 'string' ? rules.asset : undefined,
    entry_criteria: Array.isArray(rules.entry_criteria)
      ? rules.entry_criteria.filter((item): item is string => typeof item === 'string')
      : [],
    exit_criteria: Array.isArray(rules.exit_criteria)
      ? rules.exit_criteria.filter((item): item is string => typeof item === 'string')
      : [],
    other_rules: Array.isArray(rules.other_rules)
      ? rules.other_rules.filter((item): item is string => typeof item === 'string')
      : [],
    marker: isMarker(rules.marker) ? rules.marker : undefined,
  })
}

export function formatStrategyRow<T extends Record<string, unknown>>(row: T) {
  return {
    ...row,
    rules: normalizeStrategyRules(row.rules),
  }
}
