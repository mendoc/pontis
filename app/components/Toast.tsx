'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import * as RadixToast from '@radix-ui/react-toast'
import { Text } from '@radix-ui/themes'
import { CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons'

interface ToastMessage {
  id: number
  message: string
  type: 'success' | 'error'
}

interface ToastContextValue {
  toast: (message: string, type?: 'success' | 'error') => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  let counter = 0

  const toast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = ++counter
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      <RadixToast.Provider swipeDirection="right">
        {children}
        {toasts.map((t) => (
          <RadixToast.Root
            key={t.id}
            open
            onOpenChange={(open) => {
              if (!open) setToasts((prev) => prev.filter((x) => x.id !== t.id))
            }}
            style={{
              backgroundColor: 'var(--color-background)',
              border: '1px solid var(--gray-4)',
              borderRadius: 6,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              minWidth: 280,
            }}
          >
            {t.type === 'success'
              ? <CheckCircledIcon style={{ color: 'var(--green-9)', flexShrink: 0 }} />
              : <CrossCircledIcon style={{ color: 'var(--red-9)', flexShrink: 0 }} />
            }
            <RadixToast.Description asChild>
              <Text size="2" style={{ color: 'var(--gray-12)' }}>{t.message}</Text>
            </RadixToast.Description>
          </RadixToast.Root>
        ))}
        <RadixToast.Viewport
          style={{
            position: 'fixed',
            top: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            zIndex: 9999,
            outline: 'none',
          }}
        />
      </RadixToast.Provider>
    </ToastContext.Provider>
  )
}
