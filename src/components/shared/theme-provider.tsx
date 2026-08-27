'use client'

import { useEffect } from 'react'
import { useTheme, applyTheme } from '@/lib/store/theme-store'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useTheme((s) => s.theme)
  const hydrated = useTheme((s) => s.hydrated)

  useEffect(() => {
    useTheme.persist.rehydrate()
  }, [])

  useEffect(() => {
    if (hydrated) applyTheme(theme)
  }, [theme, hydrated])

  return <>{children}</>
}
