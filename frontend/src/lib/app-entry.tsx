import { useLocation } from 'react-router-dom'

export const appEase = [0.22, 1, 0.36, 1] as const

export function useAnimateEntry() {
  const location = useLocation()
  return Boolean((location.state as { animateEntry?: boolean } | null)?.animateEntry)
}

export const sidebarVariants = {
  hidden: { x: -28, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.55, ease: appEase },
  },
}

export const sidebarItemVariants = {
  hidden: { x: -16, opacity: 0 },
  visible: (index: number) => ({
    x: 0,
    opacity: 1,
    transition: {
      delay: 0.12 + index * 0.07,
      duration: 0.45,
      ease: appEase,
    },
  }),
}

export const mainContentVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: 0.18, ease: appEase },
  },
}

export const dashboardSectionVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.3 + index * 0.1,
      duration: 0.5,
      ease: appEase,
    },
  }),
}
