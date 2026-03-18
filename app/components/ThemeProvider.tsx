'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Theme } from '@radix-ui/themes'

export type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue>({ mode: 'system', setMode: () => {} })

export function useThemeMode() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system')

  // Lire la préférence stockée au montage
  useEffect(() => {
    const stored = localStorage.getItem('pontis-theme') as ThemeMode | null
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      setModeState(stored)
    }
  }, [])

  // Appliquer la classe dark + persister en localStorage
  useEffect(() => {
    const d = document.documentElement

    const apply = (prefersDark: boolean) => {
      if (mode === 'dark') d.classList.add('dark')
      else if (mode === 'light') d.classList.remove('dark')
      else d.classList.toggle('dark', prefersDark)
    }

    apply(window.matchMedia('(prefers-color-scheme: dark)').matches)
    localStorage.setItem('pontis-theme', mode)

    if (mode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = (e: MediaQueryListEvent) => d.classList.toggle('dark', e.matches)
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [mode])

  return (
    <ThemeContext.Provider value={{ mode, setMode: setModeState }}>
      <Theme accentColor="gray" grayColor="gray" radius="none" appearance="inherit" panelBackground="solid">
        {children}
      </Theme>
    </ThemeContext.Provider>
  )
}
