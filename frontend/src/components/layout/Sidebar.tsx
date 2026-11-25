import { Link, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAccountsStore, useStrategiesStore } from '@/stores'
import {
  useAnimateEntry,
  sidebarItemVariants,
  sidebarVariants,
  mainContentVariants,
} from '@/lib/app-entry'

const navItems = [
  { label: 'Dashboard', path: '/app/dashboard' },
  { label: 'Journal', path: '/app/journal' },
  { label: 'Strategies', path: '/app/strategies' },
]

function Sidebar({ animateEntry }: { animateEntry: boolean }) {
  const location = useLocation()
  const settingsActive = location.pathname.startsWith('/app/settings')

  return (
    <motion.aside
      className="fixed inset-y-0 left-0 z-40 flex w-56 flex-col border-r border-white/10 bg-white/[0.03] backdrop-blur-xl"
      initial={animateEntry ? 'hidden' : false}
      animate="visible"
      variants={sidebarVariants}
    >
      <motion.div
        className="border-b border-white/10 px-6 py-6"
        variants={sidebarItemVariants}
        custom={0}
        initial={animateEntry ? 'hidden' : false}
        animate="visible"
      >
        <Link to="/app/dashboard" className="font-sketch text-xl text-white">
          Trading Journal
        </Link>
      </motion.div>

      <nav className="flex flex-1 flex-col gap-1 px-4 py-6">
        {navItems.map((item, index) => {
          const isActive = location.pathname.startsWith(item.path)
          return (
            <motion.div
              key={item.path}
              variants={sidebarItemVariants}
              custom={index + 1}
              initial={animateEntry ? 'hidden' : false}
              animate="visible"
            >
              <Link
                to={item.path}
                className={cn(
                  'block rounded-lg px-4 py-2.5 text-sm transition-colors',
                  isActive ? 'text-[#B09D9D]' : 'text-white/50 hover:text-white/80'
                )}
              >
                {item.label}
              </Link>
            </motion.div>
          )
        })}
      </nav>

      <motion.div
        className="border-t border-white/10 px-4 py-4"
        variants={sidebarItemVariants}
        custom={navItems.length + 1}
        initial={animateEntry ? 'hidden' : false}
        animate="visible"
      >
        <Link
          to="/app/settings"
          className={cn(
            'flex w-full items-center gap-2 rounded-lg px-4 py-2.5 text-sm transition-colors',
            settingsActive ? 'text-[#B09D9D]' : 'text-white/50 hover:text-white/80'
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </motion.div>
    </motion.aside>
  )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const animateEntry = useAnimateEntry()

  useEffect(() => {
    useAccountsStore.getState().fetchAccounts()
    useStrategiesStore.getState().fetchStrategies()
  }, [])

  return (
    <div className="bg-mesh min-h-screen">
      <Sidebar animateEntry={animateEntry} />
      <motion.main
        className="ml-56 min-h-screen overflow-y-auto p-8"
        initial={animateEntry ? 'hidden' : false}
        animate="visible"
        variants={mainContentVariants}
      >
        {children}
      </motion.main>
    </div>
  )
}
