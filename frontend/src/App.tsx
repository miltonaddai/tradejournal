import { Routes, Route, Navigate } from 'react-router-dom'
import { LandingPage } from '@/pages/LandingPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { JournalPage } from '@/pages/JournalPage'
import { StrategiesPage } from '@/pages/StrategiesPage'
import { ImportTradesPage } from '@/pages/ImportTradesPage'
import { TradeReviewPage } from '@/pages/TradeReviewPage'
import { SettingsPage } from '@/pages/SettingsPage'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route path="/app/dashboard" element={<DashboardPage />} />
      <Route path="/app/journal" element={<JournalPage />} />
      <Route path="/app/strategies" element={<StrategiesPage />} />
      <Route path="/app/settings" element={<SettingsPage />} />
      <Route path="/app/import" element={<ImportTradesPage />} />
      <Route path="/app/trades/:tradeId" element={<TradeReviewPage />} />
      <Route path="/app/*" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
