'use client'

import { usePathname } from 'next/navigation'
import { useMemo } from 'react'

import { HIDDEN_ROUTES } from '@/app/Nav/constants'

/**
 * Hook to determine if the global layout chrome should be hidden based on the current route
 * @returns {boolean} true if the layout should be hidden, false otherwise
 */
export function useLayoutVisibility(): boolean {
  const pathname = usePathname()

  return useMemo(() => {
    if (!pathname) return false
    return HIDDEN_ROUTES.some((route) => pathname.startsWith(route))
  }, [pathname])
}
