import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { AppLayout } from '@/components/layout/Sidebar'
import { GlassCard } from '@/components/layout/GlassCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api, type Account } from '@/lib/api'
import { useAccountsStore, useUserStore } from '@/stores'

const accountSourceLabels: Record<Account['source'], string> = {
  csv: 'CSV import',
  broker: 'Broker',
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  try {
    return format(new Date(value), 'MMM d, yyyy')
  } catch {
    return '—'
  }
}

export function SettingsPage() {

  const profile = useUserStore((state) => state.profile)
  const loading = useUserStore((state) => state.loading)
  const error = useUserStore((state) => state.error)
  const fetchUser = useUserStore((state) => state.fetchUser)
  const setProfile = useUserStore((state) => state.setProfile)

  const accounts = useAccountsStore((state) => state.accounts)
  const fetchAccounts = useAccountsStore((state) => state.fetchAccounts)

  const [displayName, setDisplayName] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMessage, setProfileMessage] = useState<string | null>(null)

  useEffect(() => {
    fetchUser()
    fetchAccounts()
  }, [fetchAccounts, fetchUser])

  useEffect(() => {
    if (profile?.display_name !== undefined) {
      setDisplayName(profile.display_name ?? '')
    }
  }, [profile?.display_name, profile?.id])

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    setProfileMessage(null)

    try {
      const updated = await api.users.updateProfile({
        display_name: displayName.trim() || null,
      })
      setProfile(updated)
      setProfileMessage('Profile updated.')
    } catch (saveError) {
      setProfileMessage(
        saveError instanceof Error ? saveError.message : 'Unable to update profile'
      )
    } finally {
      setSavingProfile(false)
    }
  }

  const showInitialLoading = loading && !profile

  return (
    <AppLayout>
      <h1 className="mb-6 text-2xl font-body">Settings</h1>

      {showInitialLoading && <p className="text-sm text-white/45">Loading settings…</p>}
      {error && <p className="mb-6 text-sm text-loss">{error}</p>}

      {!showInitialLoading && !error && (
        <div className="mx-auto max-w-3xl space-y-8">
          <GlassCard className="p-6">
            <h2 className="mb-1 text-lg text-white/90">Profile</h2>
            <p className="mb-6 text-sm text-white/50">How you appear in the journal.</p>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Your name"
                />
              </div>

              <p className="text-sm text-white/45">
                Member since {formatDate(profile?.created_at)}
              </p>

              {profileMessage && (
                <p
                  className={
                    profileMessage === 'Profile updated.' ? 'text-sm text-profit' : 'text-sm text-loss'
                  }
                >
                  {profileMessage}
                </p>
              )}

              <Button onClick={handleSaveProfile} disabled={savingProfile}>
                {savingProfile ? 'Saving…' : 'Save profile'}
              </Button>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="mb-1 text-lg text-white/90">Connected accounts</h2>
                <p className="text-sm text-white/50">
                  Broker and CSV import accounts linked to your journal.
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/app/import">Add account</Link>
              </Button>
            </div>

            {accounts.length === 0 ? (
              <p className="text-sm text-white/45">No accounts connected yet.</p>
            ) : (
              <ul className="divide-y divide-white/10">
                {accounts.map((account) => (
                  <li
                    key={account.id}
                    className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium">{account.name}</p>
                      <p className="text-sm text-white/50">
                        {accountSourceLabels[account.source]} · Added{' '}
                        {formatDate(account.created_at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>

        </div>
      )}
    </AppLayout>
  )
}
