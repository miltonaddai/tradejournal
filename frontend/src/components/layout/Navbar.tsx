import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

const HIDE_DELAY_MS = 550
const SCROLL_THRESHOLD = 12
const MIN_SCROLL_Y = 72

export function Navbar() {
  const location = useLocation()
  const isAuth = location.pathname.startsWith('/app')
  const [visible, setVisible] = useState(true)
  const lastScrollY = useRef(0)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const clearHideTimer = () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current)
        hideTimer.current = null
      }
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const delta = currentScrollY - lastScrollY.current

      if (currentScrollY <= 16) {
        clearHideTimer()
        setVisible(true)
      } else if (delta < -SCROLL_THRESHOLD) {
        clearHideTimer()
        setVisible(true)
      } else if (delta > SCROLL_THRESHOLD && currentScrollY > MIN_SCROLL_Y) {
        if (!hideTimer.current) {
          hideTimer.current = setTimeout(() => {
            setVisible(false)
            hideTimer.current = null
          }, HIDE_DELAY_MS)
        }
      }

      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      clearHideTimer()
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  if (isAuth) return null

  return (
    <motion.nav
      className="fixed top-6 left-1/2 z-50 w-[calc(100%-3rem)] max-w-5xl -translate-x-1/2"
      initial={false}
      animate={{
        y: visible ? 0 : -100,
        opacity: visible ? 1 : 0,
      }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{ pointerEvents: visible ? 'auto' : 'none' }}
    >
      <div className="glass-pill flex items-center justify-between px-6 py-3">
        <Link to="/" className="font-sketch text-xl text-white">
          Trading Journal
        </Link>
        <div className="flex items-center gap-6">
          <a href="/#how-it-works" className="text-sm text-white/70 transition-colors hover:text-white">
            How it works
          </a>
          <a href="/#faq" className="text-sm text-white/70 transition-colors hover:text-white">
            FAQ
          </a>
          <Link to="/app/dashboard">
            <Button size="sm">Open app</Button>
          </Link>
        </div>
      </div>
    </motion.nav>
  )
}
