'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Box, Heading, Text, Badge, Button, Flex, AlertDialog } from '@radix-ui/themes'
import { ChevronRightIcon } from '@radix-ui/react-icons'
import { useAuth } from '@/app/context/auth'
import { useProjects, Deployment } from '@/app/context/projects'
import { useToast } from '@/app/components/Toast'

type StatusFilter = 'all' | 'success' | 'failed' | 'building' | 'pending'

function buildDuration(createdAt: string, finishedAt?: string | null): string | null {
  if (!finishedAt) return null
  const secs = Math.round((new Date(finishedAt).getTime() - new Date(createdAt).getTime()) / 1000)
  if (secs < 60) return `${secs}s`
  return `${Math.floor(secs / 60)}m ${secs % 60}s`
}

function StatusBadge({ status }: { status: Deployment['status'] }) {
  if (status === 'success') return <Badge color="green" variant="soft">Succès</Badge>
  if (status === 'failed') return <Badge color="red" variant="soft">Échec</Badge>
  if (status === 'building') return <Badge color="orange" variant="soft">En cours</Badge>
  return <Badge color="gray" variant="soft">En attente</Badge>
}

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'success', label: 'Succès' },
  { value: 'failed', label: 'Échec' },
  { value: 'building', label: 'En cours' },
]

export default function DeploymentsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { fetchDeployments, rollbackDeployment } = useProjects()
  const { isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [currentDeploymentId, setCurrentDeploymentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [rollbackTarget, setRollbackTarget] = useState<Deployment | null>(null)
  const [rolling, setRolling] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = async () => {
    try {
      const page = await fetchDeployments(id)
      setDeployments(page.data)
      setCurrentDeploymentId(page.currentDeploymentId)
      return page.data
    } catch {
      return []
    }
  }

  useEffect(() => {
    if (authLoading) return
    load().finally(() => setLoading(false))
  }, [id, authLoading])

  useEffect(() => {
    const hasActive = deployments.some((d) => d.status === 'building' || d.status === 'pending')
    if (hasActive) {
      pollingRef.current = setInterval(load, 3000)
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [deployments])

  const handleRollback = async () => {
    if (!rollbackTarget) return
    setRolling(true)
    try {
      await rollbackDeployment(id, rollbackTarget.id)
      setRollbackTarget(null)
      toast('Publication lancée avec succès.')
      await load()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erreur lors de la publication.', 'error')
    } finally {
      setRolling(false)
    }
  }

  const filtered = filter === 'all' ? deployments : deployments.filter((d) => d.status === filter)

  if (loading) return <Text size="3" style={{ color: 'var(--gray-9)' }}>Chargement…</Text>

  return (
    <Box>
      <Heading size="6" mb="2" style={{ color: 'var(--gray-12)', fontWeight: 700 }}>
        Déploiements
      </Heading>
      <Text size="2" mb="6" style={{ color: 'var(--gray-9)', display: 'block' }}>
        Historique des déploiements du projet.
      </Text>

      {/* Filtres */}
      <Flex gap="3" mb="4">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            style={{
              height: 28,
              padding: '0 12px',
              borderRadius: 0,
              border: '1px solid',
              borderColor: filter === f.value ? 'var(--gray-12)' : 'transparent',
              background: filter === f.value ? 'var(--gray-12)' : 'transparent',
              color: filter === f.value ? 'var(--gray-1)' : 'var(--gray-11)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              lineHeight: '28px',
              whiteSpace: 'nowrap',
            }}
          >
            {f.label}
          </button>
        ))}
      </Flex>

      {filtered.length === 0 ? (
        <Text size="2" style={{ color: 'var(--gray-9)' }}>
          {deployments.length === 0 ? 'Aucun déploiement pour ce projet.' : 'Aucun déploiement pour ce filtre.'}
        </Text>
      ) : (
        <Box style={{ border: '1px solid var(--gray-4)', borderRadius: 0 }}>
          {filtered.map((dep, i) => {
            const duration = buildDuration(dep.createdAt, dep.finishedAt)
            const isProduction = dep.id === currentDeploymentId
            const isLast = i === filtered.length - 1

            return (
              <Flex
                key={dep.id}
                align="center"
                onClick={() => router.push(`/projects/${id}/deployments/${dep.id}`)}
                style={{
                  padding: '14px 16px',
                  cursor: 'pointer',
                  borderBottom: isLast ? 'none' : '1px solid var(--gray-4)',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gray-2)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Numéro */}
                <Text size="1" style={{ color: 'var(--gray-9)', fontFamily: 'monospace', minWidth: 28 }}>
                  #{deployments.length - deployments.indexOf(dep)}
                </Text>

                {/* Statut + badges */}
                <Flex align="center" gap="2" style={{ minWidth: 180 }}>
                  <StatusBadge status={dep.status} />
                  {isProduction && <Badge color="blue" variant="soft">En production</Badge>}
                </Flex>

                {/* Date + durée */}
                <Box style={{ flex: 1 }}>
                  <Text size="2" style={{ color: 'var(--gray-12)', display: 'block' }}>
                    {new Date(dep.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </Text>
                  {duration && (
                    <Text size="1" style={{ color: 'var(--gray-9)', display: 'block', marginTop: 2 }}>
                      Déployé en {duration}
                    </Text>
                  )}
                </Box>

                {/* Action + chevron */}
                <Flex align="center" gap="3">
                  {dep.status === 'success' && !isProduction && (
                    <Button
                      size="1"
                      variant="ghost"
                      color="gray"
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => { e.stopPropagation(); setRollbackTarget(dep) }}
                    >
                      Publier cette version
                    </Button>
                  )}
                  <ChevronRightIcon style={{ color: 'var(--gray-8)', flexShrink: 0 }} />
                </Flex>
              </Flex>
            )
          })}
        </Box>
      )}

      <AlertDialog.Root open={!!rollbackTarget} onOpenChange={(open) => { if (!open) setRollbackTarget(null) }}>
        <AlertDialog.Content maxWidth="420px">
          <AlertDialog.Title>Publier cette version</AlertDialog.Title>
          <AlertDialog.Description size="2">
            Le container sera recréé depuis l'image de ce déploiement. La version actuellement en production sera remplacée.
          </AlertDialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray" disabled={rolling}>Annuler</Button>
            </AlertDialog.Cancel>
            <Button variant="solid" color="gray" highContrast onClick={handleRollback} disabled={rolling} style={{ cursor: 'pointer' }}>
              {rolling ? 'Publication en cours…' : 'Confirmer la publication'}
            </Button>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Box>
  )
}
