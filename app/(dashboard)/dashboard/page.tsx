'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertDialog, Badge, Box, Button, DropdownMenu, Flex, Heading, Text, TextField } from '@radix-ui/themes'
import { DotsHorizontalIcon, ExternalLinkIcon } from '@radix-ui/react-icons'
import { useProjects, Project } from '@/app/context/projects'
import { useAuth } from '@/app/context/auth'

const STATUS_LABELS: Record<string, string> = {
  running: 'En ligne',
  building: 'En cours',
  stopped: 'Arrêté',
  failed: 'Échoué',
}

const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status] ?? status
  if (status === 'running') return <Badge color="green" variant="soft">{label}</Badge>
  if (status === 'building') return <Badge color="orange" variant="soft">{label}</Badge>
  if (status === 'failed') return <Badge color="red" variant="soft">{label}</Badge>
  return <Badge color="gray" variant="soft">{label}</Badge>
}

function ProjectRow({ project, createdBy, onUpdate, onDelete }: {
  project: Project
  createdBy: string
  onUpdate: (updated: Project) => void
  onDelete: (id: string) => void
}) {
  const router = useRouter()
  const { startProject, stopProject, restartProject, deleteProject } = useProjects()
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleAction = async (key: string, action: () => Promise<Project>) => {
    setActionLoading(key)
    try {
      const updated = await action()
      onUpdate(updated)
    } catch {
      // silencieux
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async () => {
    if (deleteInput !== project.slug) return
    setDeleteLoading(true)
    setDeleteError(null)
    try {
      await deleteProject(project.id)
      onDelete(project.id)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Erreur lors de la suppression')
      setDeleteLoading(false)
    }
  }

  const isRunning = project.status === 'running'
  const isStopped = project.status === 'stopped'
  const isBusy = !!actionLoading || project.status === 'building'

  return (
    <>
      <tr
        onClick={() => router.push(`/projects/${project.id}/settings`)}
        style={{ cursor: 'pointer', borderBottom: '1px solid var(--gray-4)' }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray-2)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
      >
        {/* Nom */}
        <td style={{ padding: '12px 16px' }}>
          <Text size="2" weight="medium" style={{ color: 'var(--gray-12)' }}>{project.name}</Text>
        </td>

        {/* Sous-domaine */}
        <td style={{ padding: '12px 16px' }}>
          {project.domain ? (
            <a
              href={`https://${project.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--accent-9)', textDecoration: 'none' }}
            >
              {project.domain}
              <ExternalLinkIcon width={12} height={12} />
            </a>
          ) : (
            <Text size="2" style={{ color: 'var(--gray-8)' }}>—</Text>
          )}
        </td>

        {/* Statut */}
        <td style={{ padding: '12px 16px' }}>
          <StatusBadge status={project.status} />
        </td>

        {/* Créé par */}
        <td style={{ padding: '12px 16px' }}>
          <Text size="2" style={{ color: 'var(--gray-10)' }}>{createdBy}</Text>
        </td>

        {/* Type */}
        <td style={{ padding: '12px 16px' }}>
          <Text size="2" style={{ color: 'var(--gray-10)', fontFamily: 'monospace' }}>{project.type ?? '—'}</Text>
        </td>

        {/* Date de création */}
        <td style={{ padding: '12px 16px' }}>
          <Text size="2" style={{ color: 'var(--gray-10)' }}>
            {project.createdAt ? new Date(project.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
          </Text>
        </td>

        {/* Actions */}
        <td style={{ padding: '12px 16px', width: 48 }} onClick={(e) => e.stopPropagation()}>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <Button variant="ghost" color="gray" size="1" style={{ cursor: 'pointer', padding: '0 6px', height: 28 }}>
                <DotsHorizontalIcon />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end" size="2">
              {isRunning && (
                <DropdownMenu.Item
                  disabled={isBusy}
                  onClick={() => handleAction('stop', () => stopProject(project.id))}
                >
                  {actionLoading === 'stop' ? 'Arrêt…' : 'Stopper'}
                </DropdownMenu.Item>
              )}
              {isStopped && (
                <DropdownMenu.Item
                  disabled={isBusy}
                  onClick={() => handleAction('start', () => startProject(project.id))}
                >
                  {actionLoading === 'start' ? 'Démarrage…' : 'Démarrer'}
                </DropdownMenu.Item>
              )}
              <DropdownMenu.Item
                disabled={isBusy || isStopped}
                onClick={() => handleAction('restart', () => restartProject(project.id))}
              >
                {actionLoading === 'restart' ? 'Redémarrage…' : 'Redémarrer'}
              </DropdownMenu.Item>
              <DropdownMenu.Item onClick={() => router.push(`/projects/${project.id}/logs`)}>
                Voir les logs
              </DropdownMenu.Item>
              <DropdownMenu.Separator />
              <DropdownMenu.Item
                color="red"
                onClick={() => { setDeleteInput(''); setDeleteError(null); setDeleteOpen(true) }}
              >
                Supprimer
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </td>
      </tr>

      {/* Modale de confirmation de suppression */}
      <AlertDialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialog.Content maxWidth="440px">
          <AlertDialog.Title>Supprimer le projet</AlertDialog.Title>
          <AlertDialog.Description size="2" mb="4">
            Cette action est irréversible. Le container, l'image Docker et toutes les données associées seront définitivement supprimés.
          </AlertDialog.Description>
          <Text size="2" mb="2" style={{ display: 'block' }}>
            Saisissez <strong>{project.slug}</strong> pour confirmer :
          </Text>
          <TextField.Root
            size="2"
            placeholder={project.slug}
            value={deleteInput}
            onChange={(e) => { setDeleteInput(e.target.value); setDeleteError(null) }}
            disabled={deleteLoading}
            style={{ marginBottom: 12 }}
          />
          {deleteError && (
            <Text size="2" style={{ color: 'var(--red-10)', display: 'block', marginBottom: 8 }}>{deleteError}</Text>
          )}
          <Flex gap="3" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray" disabled={deleteLoading} style={{ cursor: 'pointer' }}>
                Annuler
              </Button>
            </AlertDialog.Cancel>
            <Button
              variant="solid" color="red"
              disabled={deleteInput !== project.slug || deleteLoading}
              style={{ cursor: deleteInput === project.slug && !deleteLoading ? 'pointer' : 'not-allowed' }}
              onClick={handleDelete}
            >
              {deleteLoading ? 'Suppression…' : 'Supprimer définitivement'}
            </Button>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </>
  )
}

const LIMIT = 10

export default function DashboardPage() {
  const router = useRouter()
  const { fetchProjects } = useProjects()
  const { isLoading: authLoading, email, name } = useAuth()

  // Projets affichés sur la page courante
  const [projects, setProjects] = useState<Project[]>([])
  // Total côté serveur (pour savoir si on est en mode local ou API)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)

  const fetchRef = useRef(fetchProjects)
  fetchRef.current = fetchProjects

  const isLocalMode = total <= LIMIT

  // Chargement initial : première page, limit 10
  useEffect(() => {
    if (authLoading) return

    let active = true
    let intervalId: ReturnType<typeof setInterval> | null = null

    const load = async () => {
      try {
        const result = await fetchRef.current({ page: 1, limit: LIMIT })
        if (!active) return
        setProjects(result.data)
        setTotal(result.total)
        setPage(1)

        const hasBuilding = result.data.some((p) => p.status === 'building')
        if (hasBuilding && !intervalId) {
          intervalId = setInterval(load, 3000)
        } else if (!hasBuilding && intervalId) {
          clearInterval(intervalId)
          intervalId = null
        }
      } catch {
        // silencieux
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
      if (intervalId) clearInterval(intervalId)
    }
  }, [authLoading])

  // Recherche via API (mode multi-pages) avec debounce 300 ms
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (isLocalMode) return
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
    searchDebounce.current = setTimeout(async () => {
      setSearching(true)
      setPage(1)
      try {
        const result = await fetchRef.current({ page: 1, limit: LIMIT, search })
        setProjects(result.data)
        setTotal(result.total)
      } catch {
        // silencieux
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => { if (searchDebounce.current) clearTimeout(searchDebounce.current) }
  }, [search, isLocalMode])

  // Changement de page (mode multi-pages)
  const goToPage = async (p: number) => {
    setSearching(true)
    setPage(p)
    try {
      const result = await fetchRef.current({ page: p, limit: LIMIT, search })
      setProjects(result.data)
      setTotal(result.total)
    } catch {
      // silencieux
    } finally {
      setSearching(false)
    }
  }

  const handleUpdate = (updated: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)))
  }

  const handleDelete = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id))
    setTotal((t) => t - 1)
  }

  const createdBy = name ?? email ?? ''

  // Filtrage local (uniquement si tout tient sur une page)
  const displayedProjects = isLocalMode && search.trim() !== '' ? (() => {
    const q = normalize(search)
    return projects.filter((p) =>
      normalize(p.name).includes(q) ||
      normalize(p.domain ?? '').includes(q) ||
      normalize(STATUS_LABELS[p.status] ?? '').includes(q) ||
      normalize(p.type ?? '').includes(q) ||
      normalize(createdBy).includes(q)
    )
  })() : projects

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <Box>
      <Heading size="7" mb="6" style={{ color: 'var(--gray-12)', fontWeight: 700 }}>
        Vue d'ensemble
      </Heading>

      {/* Bouton créer en pointillés — toujours visible */}
      <Flex
        align="center" justify="center"
        mb="6"
        style={{ width: 280, height: 80, border: '1px dashed var(--gray-6)', borderRadius: 4, cursor: 'pointer' }}
        onClick={() => router.push('/projects/new')}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--gray-8)')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--gray-6)')}
      >
        <Text size="2" style={{ color: 'var(--gray-10)' }}>+ Créer un projet</Text>
      </Flex>

      {loading ? (
        <Text size="2" style={{ color: 'var(--gray-9)' }}>Chargement…</Text>
      ) : total > 0 && (
        <>
          <TextField.Root
            size="2"
            placeholder="Rechercher un service"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            mb="4"
            style={{ maxWidth: 400 }}
          />
          <Box style={{ border: '1px solid var(--gray-4)', borderRadius: 6, overflow: 'hidden', opacity: searching ? 0.6 : 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--gray-4)', backgroundColor: 'var(--gray-2)' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left' }}>
                    <Text size="1" weight="medium" style={{ color: 'var(--gray-9)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nom</Text>
                  </th>
                  <th style={{ padding: '10px 16px', textAlign: 'left' }}>
                    <Text size="1" weight="medium" style={{ color: 'var(--gray-9)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sous-domaine</Text>
                  </th>
                  <th style={{ padding: '10px 16px', textAlign: 'left' }}>
                    <Text size="1" weight="medium" style={{ color: 'var(--gray-9)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Statut</Text>
                  </th>
                  <th style={{ padding: '10px 16px', textAlign: 'left' }}>
                    <Text size="1" weight="medium" style={{ color: 'var(--gray-9)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Créé par</Text>
                  </th>
                  <th style={{ padding: '10px 16px', textAlign: 'left' }}>
                    <Text size="1" weight="medium" style={{ color: 'var(--gray-9)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</Text>
                  </th>
                  <th style={{ padding: '10px 16px', textAlign: 'left' }}>
                    <Text size="1" weight="medium" style={{ color: 'var(--gray-9)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Créé le</Text>
                  </th>
                  <th style={{ padding: '10px 16px', width: 48 }} />
                </tr>
              </thead>
              <tbody>
                {displayedProjects.length > 0 ? displayedProjects.map((project) => (
                  <ProjectRow
                    key={project.id}
                    project={project}
                    createdBy={createdBy || '—'}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                )) : (
                  <tr>
                    <td colSpan={7} style={{ padding: '24px 16px', textAlign: 'center' }}>
                      <Text size="2" style={{ color: 'var(--gray-9)' }}>Aucun service ne correspond à la recherche.</Text>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Box>

          {/* Pagination — uniquement si plus d'une page */}
          {totalPages > 1 && (
            <Flex align="center" justify="between" mt="3">
              <Text size="2" style={{ color: 'var(--gray-10)' }}>
                {total} service{total > 1 ? 's' : ''}
              </Text>
              <Flex gap="2" align="center">
                <Button
                  size="1" variant="soft" color="gray"
                  disabled={page <= 1 || searching}
                  style={{ cursor: page > 1 ? 'pointer' : 'default' }}
                  onClick={() => goToPage(page - 1)}
                >
                  ←
                </Button>
                <Text size="2" style={{ color: 'var(--gray-11)' }}>
                  {page} / {totalPages}
                </Text>
                <Button
                  size="1" variant="soft" color="gray"
                  disabled={page >= totalPages || searching}
                  style={{ cursor: page < totalPages ? 'pointer' : 'default' }}
                  onClick={() => goToPage(page + 1)}
                >
                  →
                </Button>
              </Flex>
            </Flex>
          )}
        </>
      )}
    </Box>
  )
}
