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
  createProject: (name: string, file: File, onProgress?: (pct: number) => void) => Promise<Project>
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

  const createProject = async (name: string, file: File, onProgress?: (pct: number) => void): Promise<Project> => {
    const CHUNK_SIZE = 5 * 1024 * 1024
    const authHeader = { Authorization: `Bearer ${accessToken}` }

    // 1. Init
    const initRes = await fetch('/api/v1/projects/upload/init', {
      method: 'POST',
      headers: authHeader,
    })
    if (!initRes.ok) throw new Error('Erreur lors de l\'initialisation du transfert')
    const { uploadId } = await initRes.json()

    // 2. Chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
    for (let i = 0; i < totalChunks; i++) {
      const form = new FormData()
      form.append('uploadId', uploadId)
      form.append('chunkIndex', String(i))
      form.append('chunk', file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE))
      const chunkRes = await fetch('/api/v1/projects/upload/chunk', {
        method: 'POST',
        headers: authHeader,
        body: form,
      })
      if (!chunkRes.ok) throw new Error(`Erreur lors du transfert du bloc ${i + 1}`)
      onProgress?.(Math.round(((i + 1) / totalChunks) * 100))
    }

    // 3. Finalize
    const finalRes = await fetch('/api/v1/projects/upload/finalize', {
      method: 'POST',
      headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, uploadId, totalChunks }),
    })

    if (!finalRes.ok) {
      const data = await finalRes.json().catch(() => ({}))
      throw new Error(data.error ?? 'Erreur lors de la création du projet')
    }

    return finalRes.json()
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
