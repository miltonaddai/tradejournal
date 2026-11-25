import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import type { Account } from '@/lib/api'
import { cn } from '@/lib/utils'

interface AccountMultiSelectProps {
  accounts: Account[]
  selectedAccountIds: string[]
  onChange: (accountIds: string[]) => void
}

export function AccountMultiSelect({
  accounts,
  selectedAccountIds,
  onChange,
}: AccountMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const allSelected = accounts.length > 0 && selectedAccountIds.length === accounts.length
  const label =
    accounts.length === 0
      ? 'No accounts'
      : allSelected
        ? 'All accounts'
        : `${selectedAccountIds.length} account${selectedAccountIds.length === 1 ? '' : 's'}`

  const toggleAccount = (accountId: string) => {
    if (selectedAccountIds.includes(accountId)) {
      onChange(selectedAccountIds.filter((id) => id !== accountId))
      return
    }
    onChange([...selectedAccountIds, accountId])
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        disabled={accounts.length === 0}
        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/75 transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span>{label}</span>
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </button>

      {open && accounts.length > 0 && (
        <div className="absolute right-0 z-50 mt-2 min-w-[14rem] rounded-lg border border-white/10 bg-[#111111]/95 p-2 shadow-xl backdrop-blur-xl">
          <button
            type="button"
            onClick={() => onChange(accounts.map((account) => account.id))}
            className="mb-1 flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-white/70 hover:bg-white/[0.06]"
          >
            All accounts
            {allSelected && <Check className="h-4 w-4 text-white/70" />}
          </button>
          <div className="my-1 border-t border-white/10" />
          {accounts.map((account) => {
            const selected = selectedAccountIds.includes(account.id)
            return (
              <button
                key={account.id}
                type="button"
                onClick={() => toggleAccount(account.id)}
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-white/80 hover:bg-white/[0.06]"
              >
                <span>{account.name}</span>
                {selected && <Check className="h-4 w-4 text-white/70" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
