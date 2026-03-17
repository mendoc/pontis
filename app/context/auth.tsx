'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'

interface AuthState {
  accessToken: string | null
  userId: string | null
  email: string | null
  name: string | null
  isLoading: boolean
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  resetPassword: (email: string, code: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

function decodeJwt(token: string): { email: string | null; name: string | null } {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return { email: payload.email ?? null, name: payload.name ?? null }
  } catch {
    return { email: null, name: null }
  }
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    accessToken: null,
    userId: null,
    email: null,
    name: null,
    isLoading: true,
  })
  const inflightRefresh = useRef<Promise<void> | null>(null)
  const initialized = useRef(false)

  const refreshSession = (): Promise<void> => {
    if (inflightRefresh.current) return inflightRefresh.current

    const publicPaths = ['/login', '/register', '/forgot-password', '/legal']
    const isPublicPath = publicPaths.some(
      (p) => window.location.pathname === p || window.location.pathname.startsWith(p + '/')
    )

    inflightRefresh.current = fetch('/api/v1/auth/refresh', { method: 'POST' })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json()
          const { email, name } = decodeJwt(data.accessToken)
          setState({ accessToken: data.accessToken, userId: data.userId ?? null, email, name, isLoading: false })
        } else {
          setState({ accessToken: null, userId: null, email: null, name: null, isLoading: false })
          if (!isPublicPath) window.location.replace('/login')
        }
      })
      .catch(() => {
        // Erreur réseau (API indisponible) : ne pas rediriger, le cookie reste valide
        setState({ accessToken: null, userId: null, email: null, name: null, isLoading: false })
      })
      .finally(() => {
        inflightRefresh.current = null
      })

    return inflightRefresh.current
  }

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    refreshSession()
  }, [])

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      if (data.error === 'SSO account has no password') {
        throw new Error('Ce compte utilise GitLab pour se connecter')
      }
      throw new Error(data.message ?? 'Identifiants incorrects')
    }

    const data = await res.json()
    const { email: decodedEmail, name } = decodeJwt(data.accessToken)
    setState({ accessToken: data.accessToken, userId: data.userId, email: decodedEmail, name, isLoading: false })
  }

  const register = async (email: string, password: string) => {
    const res = await fetch('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.message ?? 'Erreur lors de la création du compte')
    }

    const data = await res.json()
    const { email: decodedEmail, name } = decodeJwt(data.accessToken)
    setState({ accessToken: data.accessToken, userId: data.userId, email: decodedEmail, name, isLoading: false })
  }

  const resetPassword = async (email: string, code: string, password: string) => {
    const res = await fetch('/api/v1/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, password }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error ?? 'Une erreur est survenue')
    }
    const data = await res.json()
    const { email: decodedEmail, name } = decodeJwt(data.accessToken)
    setState({ accessToken: data.accessToken, userId: data.userId, email: decodedEmail, name, isLoading: false })
  }

  const logout = async () => {
    await fetch('/api/v1/auth/logout').catch(() => null)
    setState({ accessToken: null, userId: null, email: null, name: null, isLoading: false })
  }

  return (
    <AuthContext.Provider value={{ ...state, login, register, resetPassword, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider')
  return ctx
}
