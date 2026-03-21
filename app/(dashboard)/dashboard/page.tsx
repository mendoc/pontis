'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertDialog, Badge, Box, Button, DropdownMenu, Flex, Heading, Text, TextField } from '@radix-ui/themes'
import { DotsHorizontalIcon, CopyIcon, CheckIcon, Cross2Icon } from '@radix-ui/react-icons'
import { useProjects, Project } from '@/app/context/projects'
import { useAuth } from '@/app/context/auth'
import { useToast } from '@/app/components/Toast'
import { SortableHeader, SortOrder } from '@/app/components/SortableHeader'

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
  const { toast } = useToast()
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [domainCopied, setDomainCopied] = useState(false)
  const [restartOpen, setRestartOpen] = useState(false)
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
        <td style={{ padding: '12px 16px' }} onClick={(e) => e.stopPropagation()}>
          {project.domain ? (
            <Flex align="center" gap="2">
              <a
                href={`https://${project.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 13, color: 'var(--accent-9)', textDecoration: 'none' }}
              >
                https://{project.domain}
              </a>
              <button
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--gray-8)', display: 'flex', alignItems: 'center' }}
                onClick={() => {
                  navigator.clipboard.writeText(`https://${project.domain}`)
                  setDomainCopied(true)
                  setTimeout(() => setDomainCopied(false), 2000)
                }}
              >
                {domainCopied ? <CheckIcon style={{ color: 'var(--green-9)' }} /> : <CopyIcon />}
              </button>
            </Flex>
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
            {(() => {
              const raw = project.lastDeployedAt ?? project.createdAt
              if (!raw) return '—'
              const d = new Date(raw)
              const today = new Date()
              const isToday = d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate()
              return isToday
                ? `Auj. ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
                : d.toLocaleString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            })()}
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
                onClick={() => setRestartOpen(true)}
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

      {/* Modale de confirmation de redémarrage */}
      <AlertDialog.Root open={restartOpen} onOpenChange={setRestartOpen}>
        <AlertDialog.Content maxWidth="440px">
          <AlertDialog.Title>Redémarrer le projet</AlertDialog.Title>
          <AlertDialog.Description size="2" mb="4">
            Le container sera supprimé et recréé depuis l'image existante. Toutes les données non persistées seront perdues. Cette action est irréversible.
          </AlertDialog.Description>
          <Flex gap="3" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray" disabled={actionLoading === 'restart'} style={{ cursor: 'pointer' }}>
                Annuler
              </Button>
            </AlertDialog.Cancel>
            <Button
              variant="solid" color="orange" highContrast
              disabled={actionLoading === 'restart'}
              style={{ cursor: actionLoading === 'restart' ? 'not-allowed' : 'pointer' }}
              onClick={async () => {
                setActionLoading('restart')
                try {
                  const updated = await restartProject(project.id)
                  onUpdate(updated)
                  setRestartOpen(false)
                  toast(`${project.name} a bien redémarré.`)
                } catch {
                  setRestartOpen(false)
                  toast('Erreur lors du redémarrage.', 'error')
                } finally {
                  setActionLoading(null)
                }
              }}
            >
              {actionLoading === 'restart' ? 'Redémarrage…' : 'Redémarrer'}
            </Button>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>

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
  // Total sans filtre de recherche — seul référent fiable pour isLocalMode
  const [baseTotal, setBaseTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)

  const fetchRef = useRef(fetchProjects)
  fetchRef.current = fetchProjects

  useEffect(() => { document.title = 'Vue d\'ensemble | Pontis' }, [])

  const isLocalMode = baseTotal <= LIMIT

  // Chargement initial : première page, limit 10
  useEffect(() => {
    if (authLoading) return

    let active = true
    let intervalId: ReturnType<typeof setInterval> | null = null

    const load = async () => {
      try {
        const result = await fetchRef.current({ page: 1, limit: LIMIT, sortBy: 'createdAt', sortOrder: 'desc' })
        if (!active) return
        setProjects(result.data)
        setTotal(result.total)
        setBaseTotal(result.total)
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

  // Fetch API mutualisé (recherche + tri + pagination)
  const apiFetch = async (p: number, s: string, sb: string, so: SortOrder) => {
    const result = await fetchRef.current({ page: p, limit: LIMIT, search: s, sortBy: sb, sortOrder: so })
    setProjects(result.data)
    setTotal(result.total)
    if (!s) setBaseTotal(result.total)
    setPage(p)
  }

  // Recherche via API avec debounce 300 ms
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (isLocalMode) return
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
    searchDebounce.current = setTimeout(async () => {
      setSearching(true)
      try { await apiFetch(1, search, sortBy, sortOrder) } catch { /* silencieux */ }
      finally { setSearching(false) }
    }, 300)
    return () => { if (searchDebounce.current) clearTimeout(searchDebounce.current) }
  }, [search, isLocalMode])

  // Tri via API
  useEffect(() => {
    if (isLocalMode || loading) return
    setSearching(true)
    apiFetch(1, search, sortBy, sortOrder)
      .catch(() => {})
      .finally(() => setSearching(false))
  }, [sortBy, sortOrder])

  // Vider la recherche immédiatement (sans debounce)
  const clearSearch = async () => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
    setSearch('')
    if (!isLocalMode) {
      setSearching(true)
      try { await apiFetch(1, '', sortBy, sortOrder) } catch { /* silencieux */ }
      finally { setSearching(false) }
    }
  }

  // Changement de page
  const goToPage = async (p: number) => {
    setSearching(true)
    try { await apiFetch(p, search, sortBy, sortOrder) } catch { /* silencieux */ }
    finally { setSearching(false) }
  }

  const handleSort = (field: string) => {
    if (field === sortBy) {
      setSortOrder((prev) => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
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

  // Filtrage local (mode une seule page)
  const filteredProjects = isLocalMode && search.trim() !== '' ? (() => {
    const q = normalize(search)
    return projects.filter((p) =>
      normalize(p.name).includes(q) ||
      normalize(p.domain ?? '').includes(q) ||
      normalize(STATUS_LABELS[p.status] ?? '').includes(q) ||
      normalize(p.type ?? '').includes(q) ||
      normalize(createdBy).includes(q)
    )
  })() : projects

  // Tri local (mode une seule page)
  const displayedProjects = isLocalMode ? [...filteredProjects].sort((a, b) => {
    let av = '', bv = ''
    switch (sortBy) {
      case 'name':      av = a.name;                          bv = b.name;                          break
      case 'domain':    av = a.domain ?? '';                  bv = b.domain ?? '';                  break
      case 'status':    av = STATUS_LABELS[a.status] ?? '';   bv = STATUS_LABELS[b.status] ?? '';   break
      case 'createdBy': av = createdBy;                       bv = createdBy;                       break
      case 'type':      av = a.type ?? '';                    bv = b.type ?? '';                    break
      case 'createdAt': av = a.lastDeployedAt ?? a.createdAt ?? ''; bv = b.lastDeployedAt ?? b.createdAt ?? ''; break
    }
    const cmp = normalize(av).localeCompare(normalize(bv))
    return sortOrder === 'asc' ? cmp : -cmp
  }) : filteredProjects

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <Box>
      <Heading size="7" mb="2" style={{ color: 'var(--gray-12)', fontWeight: 700 }}>
        Vue d'ensemble
      </Heading>
      <Text size="2" mb="6" style={{ color: 'var(--gray-9)', display: 'block' }}>
        Tous vos projets déployés sur Pontis.
      </Text>

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
      ) : baseTotal > 0 && (
        <>
          <TextField.Root
            size="2"
            placeholder="Rechercher un service"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            mb="4"
            style={{ maxWidth: 400 }}
          >
            {search && (
              <TextField.Slot side="right">
                <button
                  onClick={clearSearch}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-9)', display: 'flex', alignItems: 'center', padding: 0 }}
                >
                  <Cross2Icon width={12} height={12} />
                </button>
              </TextField.Slot>
            )}
          </TextField.Root>
          <Box style={{ border: '1px solid var(--gray-4)', borderRadius: 6, overflow: 'hidden', opacity: searching ? 0.6 : 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--gray-4)', backgroundColor: 'var(--gray-2)' }}>
                  <SortableHeader label="Nom"          field="name"      sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                  <SortableHeader label="Sous-domaine" field="domain"    sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                  <SortableHeader label="Statut"       field="status"    sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                  <SortableHeader label="Créé par"     field="createdBy" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                  <SortableHeader label="Type"         field="type"      sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                  <SortableHeader label="Déployé le"   field="createdAt" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
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
