'use client'

import { createContext, useContext } from 'react'
import { useAuth } from './auth'

export interface Project {
  id: string
  name: string
  slug: string
  status: string
  domain: string | null
}

interface ProjectsContextValue {
  fetchProjects: () => Promise<Project[]>
  createProject: (name: string, file: File) => Promise<Project>
  checkSlug: (slug: string) => Promise<{ available: boolean }>
}

const ProjectsContext = createContext<ProjectsContextValue | null>(null)

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, isLoading: authLoading } = useAuth()

  const fetchProjects = async (): Promise<Project[]> => {
    if (authLoading || !accessToken) throw new Error('Non authentifié')
    const res = await fetch('/api/v1/projects', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) throw new Error('Erreur lors du chargement des projets')
    return res.json()
  }

  const createProject = async (name: string, file: File): Promise<Project> => {
    const formData = new FormData()
    formData.append('name', name)
    formData.append('file', file)

    const res = await fetch('/api/v1/projects', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error ?? 'Erreur lors de la création du projet')
    }

    return res.json()
  }

  const checkSlug = async (slug: string): Promise<{ available: boolean }> => {
    const res = await fetch(`/api/v1/projects/check-slug?slug=${encodeURIComponent(slug)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) throw new Error('Erreur lors de la vérification')
    return res.json()
  }

  return (
    <ProjectsContext.Provider value={{ fetchProjects, createProject, checkSlug }}>
      {children}
    </ProjectsContext.Provider>
  )
}

export function useProjects() {
  const ctx = useContext(ProjectsContext)
  if (!ctx) throw new Error('useProjects doit être utilisé dans un ProjectsProvider')
  return ctx
}
