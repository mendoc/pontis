'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Box, Flex, Heading, Text, Table, Badge, Button } from '@radix-ui/themes'
import { useAuth } from '@/app/context/auth'
import { useProjects, Deployment } from '@/app/context/projects'

function StatusBadge({ status }: { status: Deployment['status'] }) {
  if (status === 'success') return <Badge color="green" variant="soft">Succès</Badge>
  if (status === 'failed') return <Badge color="red" variant="soft">Échec</Badge>
  if (status === 'building') return <Badge color="orange" variant="soft">En cours</Badge>
  return <Badge color="gray" variant="soft">En attente</Badge>
}

export default function DeploymentsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { fetchDeployments } = useProjects()
  const { isLoading: authLoading } = useAuth()
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [loading, setLoading] = useState(true)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = async () => {
    try {
      const page = await fetchDeployments(id)
      setDeployments(page.data)
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
              <Table.Row key={dep.id}>
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
                  <Button
                    size="1"
                    variant="ghost"
                    color="gray"
                    style={{ cursor: 'pointer' }}
                    onClick={() => router.push(`/projects/${id}/deployments/${dep.id}`)}
                  >
                    Détails
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      )}
    </Box>
  )
}
