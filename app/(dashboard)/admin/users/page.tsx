'use client'

import { useEffect, useRef, useState } from 'react'
import { Badge, Box, Button, Flex, Heading, Text, TextField } from '@radix-ui/themes'
import { Cross2Icon, LockClosedIcon } from '@radix-ui/react-icons'
import { useAuth } from '@/app/context/auth'
import { SortableHeader, SortOrder } from '@/app/components/SortableHeader'
import { formatDate } from '@/app/lib/formatDate'

interface AdminUser {
  id: string
  email: string
  name: string | null
  role: 'developer' | 'admin'
  authMethod: 'password' | 'gitlab'
  createdAt: string
  _count: { projects: number }
}

interface UsersPage {
  data: AdminUser[]
  total: number
  page: number
  limit: number
}


function RoleBadge({ role }: { role: 'developer' | 'admin' }) {
  if (role === 'admin') return <Badge color="amber" variant="soft">Admin</Badge>
  return <Badge color="blue" variant="soft">Développeur</Badge>
}

function AuthMethodBadge({ method }: { method: 'password' | 'gitlab' }) {
  if (method === 'gitlab') return <Badge color="orange" variant="soft">GitLab</Badge>
  return <Badge color="gray" variant="soft">Mot de passe</Badge>
}

const LIMIT = 20

export default function AdminUsersPage() {
  const { accessToken, role, isLoading: authLoading, refreshSession } = useAuth()

  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)

  const tokenRef = useRef(accessToken)
  tokenRef.current = accessToken
  const sortByRef = useRef(sortBy)
  sortByRef.current = sortBy
  const sortOrderRef = useRef(sortOrder)
  sortOrderRef.current = sortOrder

  useEffect(() => {
    document.title = role === 'admin' ? 'Utilisateurs | Pontis' : 'Accès refusé | Pontis'
  }, [role])

  const authFetch = async (url: string): Promise<Response> => {
    const doRequest = (token: string | null) =>
      fetch(url, { headers: { Authorization: `Bearer ${token}` } })

    const res = await doRequest(tokenRef.current)
    if (res.status !== 401) return res

    const newToken = await refreshSession()
    return doRequest(newToken)
  }

  const fetchUsers = async (p: number, s: string, sb: string, so: SortOrder): Promise<UsersPage> => {
    const params = new URLSearchParams({
      page: String(p),
      limit: String(LIMIT),
      sortBy: sb,
      sortOrder: so,
      ...(s ? { search: s } : {}),
    })
    const res = await authFetch(`/api/v1/users?${params}`)
    if (!res.ok) throw new Error('Erreur lors du chargement des utilisateurs')
    return res.json()
  }

  // Chargement initial
  useEffect(() => {
    if (authLoading) return
    let active = true

    fetchUsers(1, '', 'createdAt', 'desc')
      .then((result) => {
        if (!active) return
        setUsers(result.data)
        setTotal(result.total)
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false }
  }, [authLoading])

  const apiFetch = async (p: number, s: string, sb: string, so: SortOrder) => {
    const result = await fetchUsers(p, s, sb, so)
    setUsers(result.data)
    setTotal(result.total)
    setPage(p)
  }

  // Recherche avec debounce
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

  // Tri
  useEffect(() => {
    if (loading) return
    setSearching(true)
    apiFetch(1, search, sortBy, sortOrder)
      .catch(() => {})
      .finally(() => setSearching(false))
  }, [sortBy, sortOrder])

  const clearSearch = async () => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
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
    if (field === sortBy) {
      setSortOrder((prev) => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const totalPages = Math.ceil(total / LIMIT)

  if (!authLoading && role !== 'admin') {
    return (
      <Flex direction="column" align="center" justify="center" style={{ height: '60vh', gap: 16 }}>
        <Box style={{ color: 'var(--gray-8)', display: 'flex' }}>
          <LockClosedIcon width={40} height={40} />
        </Box>
        <Heading size="4" style={{ color: 'var(--gray-11)', fontWeight: 600 }}>Accès refusé</Heading>
        <Text size="2" style={{ color: 'var(--gray-9)', textAlign: 'center', maxWidth: 320 }}>
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        </Text>
      </Flex>
    )
  }

  return (
    <Box>
      <Heading size="7" mb="2" style={{ color: 'var(--gray-12)', fontWeight: 700 }}>
        Utilisateurs
      </Heading>
      <Text size="2" mb="6" style={{ color: 'var(--gray-9)', display: 'block' }}>
        Tous les comptes enregistrés sur la plateforme.
      </Text>

      {loading ? (
        <Text size="2" style={{ color: 'var(--gray-9)' }}>Chargement…</Text>
      ) : (
        <>
          <TextField.Root
            size="2"
            placeholder="Rechercher par nom ou email"
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
                  <SortableHeader label="Nom"          field="name"       sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                  <SortableHeader label="Email"        field="email"      sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                  <SortableHeader label="Rôle"         field="role"       sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                  <SortableHeader label="Authentif."   field="authMethod" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                  <SortableHeader label="Projets"      field="projects"   sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                  <SortableHeader label="Inscrit"      field="createdAt"  sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? users.map((user) => (
                  <tr
                    key={user.id}
                    style={{ borderBottom: '1px solid var(--gray-4)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray-2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <Text size="2" weight="medium" style={{ color: 'var(--gray-12)' }}>
                        {user.name ?? <span style={{ color: 'var(--gray-8)' }}>—</span>}
                      </Text>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <Text size="2" style={{ color: 'var(--gray-11)', fontFamily: 'monospace' }}>{user.email}</Text>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <RoleBadge role={user.role} />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <AuthMethodBadge method={user.authMethod} />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <Text size="2" style={{ color: 'var(--gray-10)' }}>{user._count.projects}</Text>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <Text size="2" style={{ color: 'var(--gray-10)' }}>{formatDate(user.createdAt)}</Text>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} style={{ padding: '24px 16px', textAlign: 'center' }}>
                      <Text size="2" style={{ color: 'var(--gray-9)' }}>
                        {search ? 'Aucun utilisateur ne correspond à la recherche.' : 'Aucun utilisateur.'}
                      </Text>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Box>

          {totalPages > 1 && (
            <Flex align="center" justify="between" mt="3">
              <Text size="2" style={{ color: 'var(--gray-10)' }}>
                {total} utilisateur{total > 1 ? 's' : ''}
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
