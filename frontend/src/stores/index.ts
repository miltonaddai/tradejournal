import { useDashboardStore } from './dashboardStore'
import { useTradesStore } from './tradesStore'

export { useAccountsStore } from './accountsStore'
export { useDashboardStore } from './dashboardStore'
export { useJournalStore } from './journalStore'
export { useStrategiesStore } from './strategiesStore'
export { useTradesStore } from './tradesStore'
export { useUserStore } from './userStore'

export function invalidateTradeData() {
  useDashboardStore.getState().invalidate()
  useTradesStore.getState().invalidate()
}
