'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/app/context/auth'
import { useProjects } from '@/app/context/projects'
import { ForbiddenView } from './ForbiddenView'

export function ProjectAccessGuard({ id, children }: { id: string; children: React.ReactNode }) {
  const { getProject } = useProjects()
  const { isLoading: authLoading } = useAuth()
  const [forbidden, setForbidden] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (authLoading) return
    getProject(id)
      .catch((err) => { if (err instanceof Error && err.message === 'FORBIDDEN') setForbidden(true) })
      .finally(() => setChecking(false))
  }, [id, authLoading])

  if (checking) return null
  if (forbidden) return <ForbiddenView />
  return <>{children}</>
}
