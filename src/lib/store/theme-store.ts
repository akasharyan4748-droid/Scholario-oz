'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark'

export interface AccentColorConfig {
  name: string
  value: string
  primaryClass: string
  bgLightClass: string
  borderClass: string
  textClass: string
}

interface ThemeState {
  theme: ThemeMode
  accentColor: string
  hydrated: boolean
  setHydrated: () => void
  toggle: () => void
  set: (t: ThemeMode) => void
  setAccentColor: (accent: string) => void
}

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      accentColor: 'emerald',
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      toggle: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
      set: (t) => {
        applyTheme(t)
        set({ theme: t })
      },
      setAccentColor: (accent) => {
        applyAccentColor(accent)
        set({ accentColor: accent })
      },
    }),
    {
      name: 'scholario-theme',
      onRehydrateStorage: () => (state) => {
        useTheme.setState({ hydrated: true })
        if (state) state.setHydrated()
        if (state?.theme) applyTheme(state.theme)
        if (state?.accentColor) applyAccentColor(state.accentColor)
      },
    }
  )
)

// Apply theme to <html> element
export function applyTheme(theme: ThemeMode) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (theme === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
}

// Map accent names to CSS color values
const ACCENT_MAP: Record<string, string> = {
  emerald: 'oklch(0.55 0.14 162)',
  teal: 'oklch(0.6 0.13 180)',
  amber: 'oklch(0.7 0.16 75)',
  rose: 'oklch(0.65 0.2 25)',
  violet: 'oklch(0.6 0.18 300)',
  cyan: 'oklch(0.7 0.15 200)',
  indigo: 'oklch(0.5 0.2 270)',
  blue: 'oklch(0.55 0.2 250)',
}

export function applyAccentColor(accentName: string) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const colorVal = ACCENT_MAP[accentName.toLowerCase()] || ACCENT_MAP.emerald
  root.style.setProperty('--primary', colorVal)
  root.style.setProperty('--ring', colorVal)
  root.style.setProperty('--sidebar-primary', colorVal)
  root.setAttribute('data-accent', accentName.toLowerCase())
}
