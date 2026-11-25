import { useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { AppLayout } from '@/components/layout/Sidebar'
import { GlassCard } from '@/components/layout/GlassCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@/lib/api'
import { previewCsv } from '@/lib/parseCsv'
import { invalidateTradeData, useAccountsStore } from '@/stores'

export function ImportTradesPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const accounts = useAccountsStore((state) => state.accounts)
  const fetchAccounts = useAccountsStore((state) => state.fetchAccounts)
  const addAccount = useAccountsStore((state) => state.addAccount)

  const [accountName, setAccountName] = useState('')
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([])
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([])
  const [previewCount, setPreviewCount] = useState(0)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const handleFileUpload = () => {
    fileRef.current?.click()
  }

  const handleFileChange = async (file?: File) => {
    if (!file) return

    setSelectedFile(file)
    setError(null)
    setStatus(null)

    try {
      const preview = await previewCsv(file)
      setPreviewHeaders(preview.headers)
      setPreviewRows(preview.rows)
      setPreviewCount(preview.rowCount)
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : 'Unable to read CSV')
      setPreviewHeaders([])
      setPreviewRows([])
      setPreviewCount(0)
    }
  }

  const handleImport = async () => {
    if (!selectedFile) {
      setError('Choose a CSV file to import.')
      return
    }

    const trimmedName = accountName.trim()
    if (!selectedAccountId && !trimmedName) {
      setError('Enter an account name or select an existing account.')
      return
    }

    setImporting(true)
    setError(null)
    setStatus(null)

    try {
      let accountId = selectedAccountId

      if (!accountId && trimmedName) {
        const account = await api.accounts.create(trimmedName, 'csv')
        accountId = account.id
        addAccount(account)
        setSelectedAccountId(account.id)
        setAccountName('')
      }

      const result = await api.trades.import(selectedFile, {
        accountId,
        accountName: trimmedName || undefined,
      })

      invalidateTradeData()

      setStatus(
        result.status === 'processing'
          ? `Import queued for processing (${previewCount} rows detected).`
          : `Imported ${result.trades_imported ?? previewCount} trades successfully.`
      )
      setSelectedFile(null)
      setPreviewHeaders([])
      setPreviewRows([])
      setPreviewCount(0)
      if (fileRef.current) fileRef.current.value = ''
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  return (
    <AppLayout>
      <div className="flex min-h-[calc(100vh-4rem)] flex-col">
        <h1 className="shrink-0 text-2xl font-body">Import trades</h1>

        <div className="mt-8 max-w-2xl space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="account-name">Account name</Label>
              <Input
                id="account-name"
                value={accountName}
                onChange={(e) => {
                  setAccountName(e.target.value)
                  setSelectedAccountId('')
                }}
                placeholder="e.g. Main Futures, Swing Account"
                className="mt-2"
              />
            </div>

            {accounts.length > 0 && (
              <div>
                <Label htmlFor="existing-account">Or select existing account</Label>
                <Select
                  value={selectedAccountId || undefined}
                  onValueChange={(value) => {
                    if (value === '__new__') {
                      setSelectedAccountId('')
                      return
                    }
                    setSelectedAccountId(value)
                    setAccountName('')
                  }}
                >
                  <SelectTrigger id="existing-account" className="mt-2">
                    <SelectValue placeholder="Select an existing account" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__new__">None — create new account above</SelectItem>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <GlassCard
            variant="dark"
            className="flex h-56 cursor-pointer flex-col items-center justify-center transition-colors hover:bg-white/[0.08]"
            onClick={handleFileUpload}
          >
            <Plus className="mb-4 h-12 w-12 text-white/60" />
            <p className="text-base text-white/80">
              {selectedFile ? selectedFile.name : 'Upload csv trades'}
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0])}
            />
          </GlassCard>
        </div>

        {previewCount > 0 && (
          <div className="mt-8 max-w-2xl">
            <p className="mb-3 text-sm text-white/60">
              Previewing {previewCount} rows from CSV
            </p>
            <div className="overflow-x-auto rounded-lg border border-white/10">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white/[0.04] text-white/50">
                  <tr>
                    {previewHeaders.map((header) => (
                      <th key={header} className="px-4 py-2 font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, index) => (
                    <tr key={index} className="border-t border-white/5">
                      {previewHeaders.map((header) => (
                        <td key={header} className="px-4 py-2 text-white/75">
                          {row[header]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-6 flex max-w-2xl items-center gap-4">
          <Button onClick={handleImport} disabled={importing || !selectedFile}>
            {importing ? 'Importing…' : 'Import trades'}
          </Button>
          {status && <p className="text-sm text-profit">{status}</p>}
          {error && <p className="text-sm text-loss">{error}</p>}
        </div>
      </div>
    </AppLayout>
  )
}
