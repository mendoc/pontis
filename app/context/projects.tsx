'use client'

import { createContext, useContext, useState } from 'react'
import { useAuth } from './auth'

export interface Project {
  id: string
  name: string
  slug: string
  type?: string
  status: string
  domain: string | null
  createdAt?: string
  restartedAt?: string | null
}

export interface ProjectsPage {
  data: Project[]
  total: number
  page: number
  limit: number
}

interface ProjectsContextValue {
  projects: Project[]
  fetchProjects: (opts?: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }) => Promise<ProjectsPage>
  getProject: (id: string) => Promise<Project>
  createProject: (name: string, file: File, onProgress?: (pct: number) => void) => Promise<Project>
  redeployProject: (id: string, file: File, onProgress?: (pct: number) => void) => Promise<Project>
  renameProject: (id: string, name: string) => Promise<Project>
  startProject: (id: string) => Promise<Project>
  stopProject: (id: string) => Promise<Project>
  restartProject: (id: string) => Promise<Project>
  checkSlug: (slug: string) => Promise<{ available: boolean }>
  deleteProject: (id: string) => Promise<void>
}

const ProjectsContext = createContext<ProjectsContextValue | null>(null)

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, isLoading: authLoading, refreshSession } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])

  // Effectue un fetch authentifié. En cas de 401, rafraîchit le token et retente une fois.
  const authFetch = async (input: string, init: RequestInit = {}): Promise<Response> => {
    const doRequest = (token: string | null) =>
      fetch(input, { ...init, headers: { ...init.headers, Authorization: `Bearer ${token}` } })

    const res = await doRequest(accessToken)
    if (res.status !== 401) return res

    const newToken = await refreshSession()
    return doRequest(newToken)
  }

  const fetchProjects = async (opts: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {}): Promise<ProjectsPage> => {
    if (authLoading || !accessToken) throw new Error('Non authentifié')
    const params = new URLSearchParams()
    params.set('page', String(opts.page ?? 1))
    params.set('limit', String(opts.limit ?? 100))
    if (opts.search?.trim()) params.set('search', opts.search.trim())
    if (opts.sortBy) params.set('sortBy', opts.sortBy)
    if (opts.sortOrder) params.set('sortOrder', opts.sortOrder)
    const res = await authFetch(`/api/v1/projects?${params}`)
    if (!res.ok) throw new Error('Erreur lors du chargement des projets')
    const result: ProjectsPage = await res.json()
    setProjects(result.data)
    return result
  }

  const getProject = async (id: string): Promise<Project> => {
    const res = await authFetch(`/api/v1/projects/${id}`)
    if (!res.ok) throw new Error('Projet introuvable')
    return res.json()
  }

  const redeployProject = async (id: string, file: File, onProgress?: (pct: number) => void): Promise<Project> => {
    const CHUNK_SIZE = 5 * 1024 * 1024

    const initRes = await authFetch('/api/v1/projects/upload/init', { method: 'POST' })
    if (!initRes.ok) throw new Error('Erreur lors de l\'initialisation du transfert')
    const { uploadId } = await initRes.json()

    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
    for (let i = 0; i < totalChunks; i++) {
      const form = new FormData()
      form.append('uploadId', uploadId)
      form.append('chunkIndex', String(i))
      form.append('chunk', file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE))
      const chunkRes = await authFetch('/api/v1/projects/upload/chunk', { method: 'POST', body: form })
      if (!chunkRes.ok) throw new Error(`Erreur lors du transfert du bloc ${i + 1}`)
      onProgress?.(Math.round(((i + 1) / totalChunks) * 100))
    }

    const finalRes = await authFetch('/api/v1/projects/upload/redeploy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: id, uploadId, totalChunks }),
    })

    if (!finalRes.ok) {
      const data = await finalRes.json().catch(() => ({}))
      throw new Error(data.error ?? 'Erreur lors du redéploiement')
    }

    return finalRes.json()
  }

  const renameProject = async (id: string, name: string): Promise<Project> => {
    const res = await authFetch(`/api/v1/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error ?? 'Erreur lors du renommage')
    }
    const updated: Project = await res.json()
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, name: updated.name } : p)))
    return updated
  }

  const createProject = async (name: string, file: File, onProgress?: (pct: number) => void): Promise<Project> => {
    const CHUNK_SIZE = 5 * 1024 * 1024

    // 1. Init
    const initRes = await authFetch('/api/v1/projects/upload/init', { method: 'POST' })
    if (!initRes.ok) throw new Error('Erreur lors de l\'initialisation du transfert')
    const { uploadId } = await initRes.json()

    // 2. Chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
    for (let i = 0; i < totalChunks; i++) {
      const form = new FormData()
      form.append('uploadId', uploadId)
      form.append('chunkIndex', String(i))
      form.append('chunk', file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE))
      const chunkRes = await authFetch('/api/v1/projects/upload/chunk', { method: 'POST', body: form })
      if (!chunkRes.ok) throw new Error(`Erreur lors du transfert du bloc ${i + 1}`)
      onProgress?.(Math.round(((i + 1) / totalChunks) * 100))
    }

    // 3. Finalize
    const finalRes = await authFetch('/api/v1/projects/upload/finalize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, uploadId, totalChunks }),
    })

    if (!finalRes.ok) {
      const data = await finalRes.json().catch(() => ({}))
      throw new Error(data.error ?? 'Erreur lors de la création du projet')
    }

    return finalRes.json()
  }

  const startProject = async (id: string): Promise<Project> => {
    const res = await authFetch(`/api/v1/projects/${id}/start`, { method: 'POST' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error ?? 'Erreur lors du démarrage')
    }
    const updated: Project = await res.json()
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, status: updated.status } : p)))
    return updated
  }

  const stopProject = async (id: string): Promise<Project> => {
    const res = await authFetch(`/api/v1/projects/${id}/stop`, { method: 'POST' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error ?? 'Erreur lors de l\'arrêt')
    }
    const updated: Project = await res.json()
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, status: updated.status } : p)))
    return updated
  }

  const restartProject = async (id: string): Promise<Project> => {
    const res = await authFetch(`/api/v1/projects/${id}/restart`, { method: 'POST' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error ?? 'Erreur lors du redémarrage')
    }
    const updated: Project = await res.json()
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, status: updated.status } : p)))
    return updated
  }

  const checkSlug = async (slug: string): Promise<{ available: boolean }> => {
    const res = await authFetch(`/api/v1/projects/check-slug?slug=${encodeURIComponent(slug)}`)
    if (!res.ok) throw new Error('Erreur lors de la vérification')
    return res.json()
  }

  const deleteProject = async (id: string): Promise<void> => {
    const res = await authFetch(`/api/v1/projects/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error ?? 'Erreur lors de la suppression')
    }
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <ProjectsContext.Provider value={{ projects, fetchProjects, getProject, createProject, redeployProject, renameProject, startProject, stopProject, restartProject, checkSlug, deleteProject }}>
      {children}
    </ProjectsContext.Provider>
  )
}

export function useProjects() {
  const ctx = useContext(ProjectsContext)
  if (!ctx) throw new Error('useProjects doit être utilisé dans un ProjectsProvider')
  return ctx
}
