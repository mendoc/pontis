'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Box, Heading, Text, Table, Badge, Button, Flex, AlertDialog } from '@radix-ui/themes'
import { useAuth } from '@/app/context/auth'
import { useProjects, Deployment } from '@/app/context/projects'
import { useToast } from '@/app/components/Toast'

function StatusBadge({ status }: { status: Deployment['status'] }) {
  if (status === 'success') return <Badge color="green" variant="soft">Succès</Badge>
  if (status === 'failed') return <Badge color="red" variant="soft">Échec</Badge>
  if (status === 'building') return <Badge color="orange" variant="soft">En cours</Badge>
  return <Badge color="gray" variant="soft">En attente</Badge>
}

export default function DeploymentsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { fetchDeployments, rollbackDeployment } = useProjects()
  const { isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [currentDeploymentId, setCurrentDeploymentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
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
      toast('Rollback lancé avec succès.')
      await load()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erreur lors du rollback.', 'error')
    } finally {
      setRolling(false)
    }
  }

  if (loading) return <Text size="3" style={{ color: 'var(--gray-9)' }}>Chargement…</Text>

  return (
    <Box>
      <Heading size="6" mb="2" style={{ color: 'var(--gray-12)', fontWeight: 700 }}>
        Déploiements
      </Heading>
      <Text size="2" mb="6" style={{ color: 'var(--gray-9)', display: 'block' }}>
        Historique des déploiements du projet.
      </Text>

      {deployments.length === 0 ? (
        <Text size="2" style={{ color: 'var(--gray-9)' }}>Aucun déploiement pour ce projet.</Text>
      ) : (
        <Table.Root variant="surface">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>#</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Statut</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {deployments.map((dep, i) => (
              <Table.Row
                key={dep.id}
                onClick={() => router.push(`/projects/${id}/deployments/${dep.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <Table.Cell>
                  <Text size="2" style={{ color: 'var(--gray-11)', fontFamily: 'monospace' }}>
                    {deployments.length - i}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="2" style={{ color: 'var(--gray-12)' }}>
                    {new Date(dep.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
                    })}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <StatusBadge status={dep.status} />
                </Table.Cell>
                <Table.Cell>
                  <Flex align="center" gap="2" justify="end">
                    {dep.id === currentDeploymentId && (
                      <Badge color="blue" variant="soft">En production</Badge>
                    )}
                    {dep.status === 'success' && dep.id !== currentDeploymentId && (
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
                  </Flex>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
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
            <Button variant="solid" color="red" onClick={handleRollback} disabled={rolling} style={{ cursor: 'pointer' }}>
              {rolling ? 'Publication en cours…' : 'Confirmer la publication'}
            </Button>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Box>
  )
}
