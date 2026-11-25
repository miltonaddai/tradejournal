import { useState, type KeyboardEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface CriteriaFieldProps {
  label: string
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
}

export function CriteriaField({ label, values, onChange, placeholder }: CriteriaFieldProps) {
  const [draft, setDraft] = useState('')

  const addCriteria = () => {
    const trimmed = draft.trim()
    if (!trimmed || values.includes(trimmed)) return
    onChange([...values, trimmed])
    setDraft('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      addCriteria()
    }
  }

  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-2 flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1"
        />
        <button
          type="button"
          onClick={addCriteria}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] text-white/70 transition-colors hover:border-white/25 hover:bg-white/10 hover:text-white"
          aria-label={`Add ${label.toLowerCase()}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {values.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {values.map((value) => (
            <span
              key={value}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80 backdrop-blur-xl"
            >
              {value}
              <button
                type="button"
                onClick={() => onChange(values.filter((item) => item !== value))}
                className="rounded-full p-0.5 text-white/40 transition-colors hover:text-white"
                aria-label={`Remove ${value}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

const MARKER_COLORS = [
  '#14b8a6',
  '#22c55e',
  '#3b82f6',
  '#a855f7',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#f97316',
]

const MARKER_EMOJIS = ['📈', '📉', '🎯', '⚡', '🔥', '💎', '🚀', '🧠', '⭐', '💰', '🛡️', '📊']

export interface StrategyMarker {
  type: 'color' | 'emoji'
  value: string
}

interface StrategyMarkerPickerProps {
  value?: StrategyMarker
  onChange: (marker: StrategyMarker) => void
}

export function StrategyMarkerPicker({ value, onChange }: StrategyMarkerPickerProps) {
  const [mode, setMode] = useState<'color' | 'emoji'>(value?.type ?? 'color')

  return (
    <div>
      <Label>Mark strategy</Label>
      <div className="mt-2 flex gap-2">
        {(['color', 'emoji'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setMode(option)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm capitalize transition-colors',
              mode === option
                ? 'bg-white/15 text-white'
                : 'text-white/45 hover:text-white/70'
            )}
          >
            {option === 'color' ? 'Colors' : 'Emojis'}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {mode === 'color'
          ? MARKER_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onChange({ type: 'color', value: color })}
                className={cn(
                  'h-9 w-9 rounded-full border-2 transition-transform hover:scale-105',
                  value?.type === 'color' && value.value === color
                    ? 'border-white ring-2 ring-white/30'
                    : 'border-transparent'
                )}
                style={{ backgroundColor: color }}
                aria-label={`Select color ${color}`}
              />
            ))
          : MARKER_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onChange({ type: 'emoji', value: emoji })}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full text-lg transition-colors hover:bg-white/10',
                  value?.type === 'emoji' && value.value === emoji && 'bg-white/15 ring-2 ring-white/20'
                )}
                aria-label={`Select emoji ${emoji}`}
              >
                {emoji}
              </button>
            ))}
      </div>
    </div>
  )
}
