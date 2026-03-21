'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertDialog, Badge, Box, Button, DropdownMenu, Flex, Heading, Text, TextField } from '@radix-ui/themes'
import { CopyIcon, CheckIcon, Cross2Icon, DotsHorizontalIcon, LockClosedIcon, PersonIcon, StopIcon, ReloadIcon, TrashIcon } from '@radix-ui/react-icons'
import { useAuth } from '@/app/context/auth'
import { useProjects, Project } from '@/app/context/projects'
import { useToast } from '@/app/components/Toast'
import { SortableHeader, SortOrder } from '@/app/components/SortableHeader'
import { formatDate } from '@/app/lib/formatDate'

interface AdminProject {
  id: string
  name: string
  slug: string
  type: 'git' | 'static'
  status: string
  domain: string | null
  createdAt: string
  lastDeployedAt: string | null
  user: { id: string; email: string; name: string | null }
}

interface ProjectsPage {
  data: AdminProject[]
  total: number
  page: number
  limit: number
}

const STATUS_LABELS: Record<string, string> = {
  running:  'En ligne',
  building: 'En cours',
  stopped:  'Arrêté',
  failed:   'Échoué',
  inactive: 'Inactif',
}

function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status] ?? status
  if (status === 'running')  return <Badge color="green"  variant="soft">{label}</Badge>
  if (status === 'building') return <Badge color="orange" variant="soft">{label}</Badge>
  if (status === 'failed')   return <Badge color="red"    variant="soft">{label}</Badge>
  return <Badge color="gray" variant="soft">{label}</Badge>
}

function DomainCell({ domain }: { domain: string | null }) {
  const [hovered, setHovered] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!domain) return <Text size="2" style={{ color: 'var(--gray-8)' }}>—</Text>

  return (
    <Flex
      align="center" gap="2"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <a
        href={`https://${domain}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        style={{ fontSize: 13, color: 'var(--accent-9)', textDecoration: 'none' }}
        onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline dashed')}
        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
      >
        https://{domain}
      </a>
      <button
        style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          display: 'flex', alignItems: 'center',
          color: copied ? 'var(--green-9)' : 'var(--gray-8)',
          opacity: hovered || copied ? 1 : 0,
          transition: 'opacity 0.15s',
        }}
        onClick={(e) => {
          e.stopPropagation()
          navigator.clipboard.writeText(`https://${domain}`)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        }}
      >
        {copied ? <CheckIcon width={11} height={11} /> : <CopyIcon width={11} height={11} />}
      </button>
    </Flex>
  )
}

function ProjectRow({ project, selected, onSelect, onUpdate, onDelete }: {
  project: AdminProject
  selected: boolean
  onSelect: (id: string, checked: boolean) => void
  onUpdate: (updated: Project) => void
  onDelete: (id: string) => void
}) {
  const router = useRouter()
  const { startProject, stopProject, restartProject, deleteProject } = useProjects()
  const { toast } = useToast()
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [restartOpen, setRestartOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const isRunning = project.status === 'running'
  const isStopped = project.status === 'stopped'
  const isBusy = !!actionLoading || project.status === 'building'

  const handleAction = async (key: string, action: () => Promise<Project>) => {
    setActionLoading(key)
    try { onUpdate(await action()) } catch { /* silencieux */ }
    finally { setActionLoading(null) }
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

  return (
    <>
      <tr
        onClick={() => router.push(`/projects/${project.id}/settings`)}
        style={{ borderBottom: '1px solid var(--gray-4)', cursor: 'pointer', backgroundColor: selected ? 'var(--blue-2)' : undefined }}
        onMouseEnter={(e) => { if (!selected) e.currentTarget.style.backgroundColor = 'var(--gray-2)' }}
        onMouseLeave={(e) => { if (!selected) e.currentTarget.style.backgroundColor = '' }}
      >
        <td style={{ padding: '12px 16px', width: 40 }} onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect(project.id, e.target.checked)}
            style={{ cursor: 'pointer', accentColor: 'var(--gray-12)', width: 15, height: 15 }}
          />
        </td>
        <td style={{ padding: '12px 16px' }}>
          <Text size="2" weight="medium" style={{ color: 'var(--gray-12)' }}>{project.name}</Text>
        </td>
        <td style={{ padding: '12px 16px' }}>
          <DomainCell domain={project.domain} />
        </td>
        <td style={{ padding: '12px 16px' }}>
          <StatusBadge status={project.status} />
        </td>
        <td style={{ padding: '12px 16px' }}>
          <Text size="2" style={{ color: 'var(--gray-10)' }}>
            {project.user.name ?? project.user.email}
          </Text>
        </td>
        <td style={{ padding: '12px 16px' }}>
          <Text size="2" style={{ color: 'var(--gray-10)', fontFamily: 'monospace' }}>{project.type}</Text>
        </td>
        <td style={{ padding: '12px 16px' }}>
          <Text size="2" style={{ color: 'var(--gray-10)' }}>
            {formatDate(project.lastDeployedAt ?? project.createdAt)}
          </Text>
        </td>
        <td style={{ padding: '12px 16px', width: 48 }} onClick={(e) => e.stopPropagation()}>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <Button variant="ghost" color="gray" size="1" style={{ cursor: 'pointer', padding: '0 6px', height: 28 }}>
                <DotsHorizontalIcon />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end" size="2">
              {isRunning && (
                <DropdownMenu.Item disabled={isBusy} onClick={() => handleAction('stop', () => stopProject(project.id))}>
                  {actionLoading === 'stop' ? 'Arrêt…' : 'Stopper'}
                </DropdownMenu.Item>
              )}
              {isStopped && (
                <DropdownMenu.Item disabled={isBusy} onClick={() => handleAction('start', () => startProject(project.id))}>
                  {actionLoading === 'start' ? 'Démarrage…' : 'Démarrer'}
                </DropdownMenu.Item>
              )}
              <DropdownMenu.Item disabled={isBusy || isStopped} onClick={() => setRestartOpen(true)}>
                {actionLoading === 'restart' ? 'Redémarrage…' : 'Redémarrer'}
              </DropdownMenu.Item>
              <DropdownMenu.Item onClick={() => router.push(`/projects/${project.id}/logs`)}>
                Voir les logs
              </DropdownMenu.Item>
              <DropdownMenu.Separator />
              <DropdownMenu.Item color="red" onClick={() => { setDeleteInput(''); setDeleteError(null); setDeleteOpen(true) }}>
                Supprimer
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </td>
      </tr>

      <AlertDialog.Root open={restartOpen} onOpenChange={setRestartOpen}>
        <AlertDialog.Content maxWidth="440px">
          <AlertDialog.Title>Redémarrer le projet</AlertDialog.Title>
          <AlertDialog.Description size="2" mb="4">
            Le container sera supprimé et recréé depuis l'image existante. Toutes les données non persistées seront perdues.
          </AlertDialog.Description>
          <Flex gap="3" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray" disabled={actionLoading === 'restart'} style={{ cursor: 'pointer' }}>Annuler</Button>
            </AlertDialog.Cancel>
            <Button
              variant="solid" color="orange" highContrast
              disabled={actionLoading === 'restart'}
              style={{ cursor: actionLoading === 'restart' ? 'not-allowed' : 'pointer' }}
              onClick={async () => {
                setActionLoading('restart')
                try {
                  onUpdate(await restartProject(project.id))
                  setRestartOpen(false)
                  toast(`${project.name} a bien redémarré.`)
                } catch {
                  setRestartOpen(false)
                  toast('Erreur lors du redémarrage.', 'error')
                } finally { setActionLoading(null) }
              }}
            >
              {actionLoading === 'restart' ? 'Redémarrage…' : 'Redémarrer'}
            </Button>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>

      <AlertDialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialog.Content maxWidth="440px">
          <AlertDialog.Title>Supprimer le projet</AlertDialog.Title>
          <AlertDialog.Description size="2" mb="4">
            Cette action est irréversible. Le container, l'image Docker et toutes les données associées seront définitivement supprimés.
          </AlertDialog.Description>
          <Text size="2" mb="2" style={{ display: 'block' }}>Saisissez <strong>{project.slug}</strong> pour confirmer :</Text>
          <TextField.Root
            size="2" placeholder={project.slug} value={deleteInput}
            onChange={(e) => { setDeleteInput(e.target.value); setDeleteError(null) }}
            disabled={deleteLoading} style={{ marginBottom: 12 }}
          />
          {deleteError && <Text size="2" style={{ color: 'var(--red-10)', display: 'block', marginBottom: 8 }}>{deleteError}</Text>}
          <Flex gap="3" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray" disabled={deleteLoading} style={{ cursor: 'pointer' }}>Annuler</Button>
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

export default function AdminProjectsPage() {
  const { accessToken, role, isLoading: authLoading, refreshSession } = useAuth()
  const { stopProject, restartProject, deleteProject } = useProjects()
  const { toast } = useToast()
  const searchParams = useSearchParams()

  const initialUserFilter = searchParams.get('user') || null

  const [projects, setProjects] = useState<AdminProject[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState(initialUserFilter ?? '')
  const [userFilter, setUserFilter] = useState<string | null>(initialUserFilter)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)

  // Sélection
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState<string | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  const tokenRef = useRef(accessToken)
  tokenRef.current = accessToken
  const sortByRef = useRef(sortBy)
  sortByRef.current = sortBy
  const sortOrderRef = useRef(sortOrder)
  sortOrderRef.current = sortOrder

  useEffect(() => {
    document.title = role === 'admin' ? 'Projets | Administration | Pontis' : 'Accès refusé | Pontis'
  }, [role])

  // Vider la sélection au changement de page
  useEffect(() => { setSelected(new Set()) }, [page, search])

  const authFetch = async (url: string): Promise<Response> => {
    const doRequest = (token: string | null) =>
      fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    const res = await doRequest(tokenRef.current)
    if (res.status !== 401) return res
    return doRequest(await refreshSession())
  }

  const fetchProjects = async (p: number, s: string, sb: string, so: SortOrder): Promise<ProjectsPage> => {
    const params = new URLSearchParams({ page: String(p), limit: String(LIMIT), sortBy: sb, sortOrder: so, ...(s ? { search: s } : {}) })
    const res = await authFetch(`/api/v1/admin/projects?${params}`)
    if (!res.ok) throw new Error('Erreur lors du chargement des projets')
    return res.json()
  }

  useEffect(() => {
    if (authLoading || role !== 'admin') return
    let active = true
    fetchProjects(1, initialUserFilter ?? '', 'createdAt', 'desc')
      .then((result) => { if (!active) return; setProjects(result.data); setTotal(result.total) })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [authLoading, role])

  const apiFetch = async (p: number, s: string, sb: string, so: SortOrder) => {
    const result = await fetchProjects(p, s, sb, so)
    setProjects(result.data)
    setTotal(result.total)
    setPage(p)
  }

  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (loading) return
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
    searchDebounce.current = setTimeout(async () => {
      setSearching(true)
      try { await apiFetch(1, search, sortByRef.current, sortOrderRef.current) } catch { /* silencieux */ }
      finally { setSearching(false) }
    }, 300)
    return () => { if (searchDebounce.current) clearTimeout(searchDebounce.current) }
  }, [search])

  useEffect(() => {
    if (loading) return
    setSearching(true)
    apiFetch(1, search, sortBy, sortOrder).catch(() => {}).finally(() => setSearching(false))
  }, [sortBy, sortOrder])

  const clearSearch = async () => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
    setSearch('')
    setUserFilter(null)
    setSearching(true)
    try { await apiFetch(1, '', sortBy, sortOrder) } catch { /* silencieux */ }
    finally { setSearching(false) }
  }

  const clearUserFilter = async () => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
    setUserFilter(null)
    setSearch('')
    setSearching(true)
    try { await apiFetch(1, '', sortBy, sortOrder) } catch { /* silencieux */ }
    finally { setSearching(false) }
  }

  const goToPage = async (p: number) => {
    setSearching(true)
    try { await apiFetch(p, search, sortBy, sortOrder) } catch { /* silencieux */ }
    finally { setSearching(false) }
  }

  const handleSort = (field: string) => {
    if (field === sortBy) setSortOrder((prev) => prev === 'asc' ? 'desc' : 'asc')
    else { setSortBy(field); setSortOrder('asc') }
  }

  const handleUpdate = (updated: Project) =>
    setProjects((prev) => prev.map((p) => p.id === updated.id ? { ...p, ...updated } as AdminProject : p))

  const handleDelete = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id))
    setTotal((t) => t - 1)
    setSelected((prev) => { const next = new Set(prev); next.delete(id); return next })
  }

  // Sélection
  const handleSelect = (id: string, checked: boolean) =>
    setSelected((prev) => { const next = new Set(prev); checked ? next.add(id) : next.delete(id); return next })

  const allSelected = projects.length > 0 && projects.every((p) => selected.has(p.id))
  const someSelected = projects.some((p) => selected.has(p.id))

  const handleSelectAll = (checked: boolean) =>
    setSelected(checked ? new Set(projects.map((p) => p.id)) : new Set())

  const selectedIds = Array.from(selected)

  // Actions de masse
  const handleBulkStop = async () => {
    setBulkLoading('stop')
    const results = await Promise.allSettled(selectedIds.map((id) => stopProject(id)))
    results.forEach((r) => { if (r.status === 'fulfilled') handleUpdate(r.value) })
    const failed = results.filter((r) => r.status === 'rejected').length
    if (failed > 0) toast(`${failed} projet(s) n'ont pas pu être arrêtés.`, 'error')
    else toast(`${selectedIds.length} projet(s) arrêtés.`)
    setSelected(new Set())
    setBulkLoading(null)
  }

  const handleBulkRestart = async () => {
    setBulkLoading('restart')
    const results = await Promise.allSettled(selectedIds.map((id) => restartProject(id)))
    results.forEach((r) => { if (r.status === 'fulfilled') handleUpdate(r.value) })
    const failed = results.filter((r) => r.status === 'rejected').length
    if (failed > 0) toast(`${failed} projet(s) n'ont pas pu être redémarrés.`, 'error')
    else toast(`${selectedIds.length} projet(s) redémarrés.`)
    setSelected(new Set())
    setBulkLoading(null)
  }

  const handleBulkDelete = async () => {
    setBulkLoading('delete')
    const results = await Promise.allSettled(selectedIds.map((id) => deleteProject(id)))
    results.forEach((r, i) => { if (r.status === 'fulfilled') handleDelete(selectedIds[i]) })
    const failed = results.filter((r) => r.status === 'rejected').length
    if (failed > 0) toast(`${failed} projet(s) n'ont pas pu être supprimés.`, 'error')
    else toast(`${selectedIds.length} projet(s) supprimés.`)
    setSelected(new Set())
    setBulkLoading(null)
    setBulkDeleteOpen(false)
  }

  const totalPages = Math.ceil(total / LIMIT)

  if (!authLoading && role !== 'admin') {
    return (
      <Flex direction="column" align="center" justify="center" style={{ height: '60vh', gap: 16 }}>
        <Box style={{ color: 'var(--gray-8)', display: 'flex' }}><LockClosedIcon width={40} height={40} /></Box>
        <Heading size="4" style={{ color: 'var(--gray-11)', fontWeight: 600 }}>Accès refusé</Heading>
        <Text size="2" style={{ color: 'var(--gray-9)', textAlign: 'center', maxWidth: 320 }}>
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        </Text>
      </Flex>
    )
  }

  return (
    <Box>
      <Heading size="7" mb="2" style={{ color: 'var(--gray-12)', fontWeight: 700 }}>Projets</Heading>
      <Text size="2" mb="6" style={{ color: 'var(--gray-9)', display: 'block' }}>
        Tous les projets déployés sur la plateforme.
      </Text>

      {loading ? (
        <Text size="2" style={{ color: 'var(--gray-9)' }}>Chargement…</Text>
      ) : (
        <>
          <Flex align="center" gap="3" mb="4">
            <TextField.Root
              size="2"
              placeholder="Rechercher par nom, domaine ou propriétaire"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setUserFilter(null) }}
              style={{ maxWidth: 400, flex: 1 }}
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
            <Text size="2" style={{ color: 'var(--gray-10)', opacity: searching ? 0.5 : 1, whiteSpace: 'nowrap' }}>
              {search ? `${total} résultat${total > 1 ? 's' : ''}` : `${total} au total`}
            </Text>
          </Flex>

          {userFilter && (
            <Flex align="center" gap="2" mb="4" mt="2">
              <Text size="1" style={{ color: 'var(--gray-9)' }}>Filtré par :</Text>
              <Flex
                align="center" gap="1"
                style={{ backgroundColor: 'var(--gray-3)', border: '1px solid var(--gray-5)', borderRadius: 4, padding: '2px 6px 2px 8px' }}
              >
                <PersonIcon width={11} height={11} style={{ color: 'var(--gray-9)', flexShrink: 0 }} />
                <Text size="1" style={{ color: 'var(--gray-11)', fontFamily: 'monospace' }}>{userFilter}</Text>
                <button
                  onClick={clearUserFilter}
                  style={{ background: 'none', border: 'none', padding: '0 0 0 4px', cursor: 'pointer', color: 'var(--gray-8)', display: 'flex', alignItems: 'center' }}
                >
                  <Cross2Icon width={10} height={10} />
                </button>
              </Flex>
            </Flex>
          )}

          {/* Barre d'actions de masse */}
          {someSelected && (
            <Flex
              align="center" gap="3" mb="3"
              style={{ padding: '10px 14px', backgroundColor: 'var(--gray-3)', borderRadius: 6, border: '1px solid var(--gray-5)' }}
            >
              <Text size="2" weight="medium" style={{ color: 'var(--gray-12)', marginRight: 4 }}>
                {selectedIds.length} projet{selectedIds.length > 1 ? 's' : ''} sélectionné{selectedIds.length > 1 ? 's' : ''}
              </Text>
              <Button
                size="1" variant="soft" color="gray"
                disabled={!!bulkLoading}
                style={{ cursor: 'pointer', gap: 6 }}
                onClick={handleBulkStop}
              >
                <StopIcon />
                {bulkLoading === 'stop' ? 'Arrêt…' : 'Stopper'}
              </Button>
              <Button
                size="1" variant="soft" color="orange"
                disabled={!!bulkLoading}
                style={{ cursor: 'pointer', gap: 6 }}
                onClick={handleBulkRestart}
              >
                <ReloadIcon />
                {bulkLoading === 'restart' ? 'Redémarrage…' : 'Redémarrer'}
              </Button>
              <Button
                size="1" variant="soft" color="red"
                disabled={!!bulkLoading}
                style={{ cursor: 'pointer', gap: 6 }}
                onClick={() => setBulkDeleteOpen(true)}
              >
                <TrashIcon />
                {bulkLoading === 'delete' ? 'Suppression…' : 'Supprimer'}
              </Button>
              <Button
                size="1" variant="ghost" color="gray"
                style={{ cursor: 'pointer', marginLeft: 'auto' }}
                onClick={() => setSelected(new Set())}
              >
                Annuler la sélection
              </Button>
            </Flex>
          )}

          <Box style={{ border: '1px solid var(--gray-4)', borderRadius: 6, overflow: 'hidden', opacity: searching ? 0.6 : 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--gray-4)', backgroundColor: 'var(--gray-2)' }}>
                  <th style={{ padding: '10px 16px', width: 40 }} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      style={{ cursor: 'pointer', accentColor: 'var(--gray-12)', width: 15, height: 15 }}
                    />
                  </th>
                  <SortableHeader label="Nom"          field="name"      sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                  <SortableHeader label="Sous-domaine" field="domain"    sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                  <SortableHeader label="Statut"       field="status"    sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                  <SortableHeader label="Propriétaire" field="owner"     sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                  <SortableHeader label="Type"         field="type"      sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                  <SortableHeader label="Déployé le"   field="createdAt" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                  <th style={{ padding: '10px 16px', width: 48 }} />
                </tr>
              </thead>
              <tbody>
                {projects.length > 0 ? projects.map((project) => (
                  <ProjectRow
                    key={project.id}
                    project={project}
                    selected={selected.has(project.id)}
                    onSelect={handleSelect}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                )) : (
                  <tr>
                    <td colSpan={8} style={{ padding: '24px 16px', textAlign: 'center' }}>
                      <Text size="2" style={{ color: 'var(--gray-9)' }}>
                        {search ? 'Aucun projet ne correspond à la recherche.' : 'Aucun projet.'}
                      </Text>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Box>

          <Flex align="center" justify="between" mt="3">
            <Text size="2" style={{ color: 'var(--gray-10)' }}>
              {total} projet{total > 1 ? 's' : ''}
            </Text>
            {totalPages > 1 && (
              <Flex gap="2" align="center">
                <Button size="1" variant="soft" color="gray" disabled={page <= 1 || searching} style={{ cursor: page > 1 ? 'pointer' : 'default' }} onClick={() => goToPage(page - 1)}>←</Button>
                <Text size="2" style={{ color: 'var(--gray-11)' }}>{page} / {totalPages}</Text>
                <Button size="1" variant="soft" color="gray" disabled={page >= totalPages || searching} style={{ cursor: page < totalPages ? 'pointer' : 'default' }} onClick={() => goToPage(page + 1)}>→</Button>
              </Flex>
            )}
          </Flex>
        </>
      )}

      {/* Dialog confirmation suppression de masse */}
      <AlertDialog.Root open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialog.Content maxWidth="440px">
          <AlertDialog.Title>Supprimer {selectedIds.length} projet{selectedIds.length > 1 ? 's' : ''}</AlertDialog.Title>
          <AlertDialog.Description size="2" mb="4">
            Cette action est irréversible. Les containers, images Docker et toutes les données associées seront définitivement supprimés.
          </AlertDialog.Description>
          <Flex gap="3" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray" disabled={bulkLoading === 'delete'} style={{ cursor: 'pointer' }}>Annuler</Button>
            </AlertDialog.Cancel>
            <Button
              variant="solid" color="red"
              disabled={bulkLoading === 'delete'}
              style={{ cursor: bulkLoading !== 'delete' ? 'pointer' : 'not-allowed' }}
              onClick={handleBulkDelete}
            >
              {bulkLoading === 'delete' ? 'Suppression…' : `Supprimer définitivement`}
            </Button>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Box>
  )
}
