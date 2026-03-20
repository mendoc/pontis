'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Box, Flex, Heading, Text, Badge, Button, AlertDialog } from '@radix-ui/themes'
import { useAuth } from '@/app/context/auth'
import { useProjects, Deployment } from '@/app/context/projects'
import { useToast } from '@/app/components/Toast'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function StatusBadge({ status }: { status: Deployment['status'] }) {
  if (status === 'success') return <Badge color="green" variant="soft">Succès</Badge>
  if (status === 'failed') return <Badge color="red" variant="soft">Échec</Badge>
  if (status === 'building') return <Badge color="orange" variant="soft">En cours</Badge>
  return <Badge color="gray" variant="soft">En attente</Badge>
}

export default function DeploymentDetailPage() {
  const { id, deploymentId } = useParams<{ id: string; deploymentId: string }>()
  const router = useRouter()
  const { getDeployment, rollbackDeployment, getProject } = useProjects()
  const { isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  const [deployment, setDeployment] = useState<Deployment | null>(null)
  const [isCurrentDeployment, setIsCurrentDeployment] = useState(false)
  const [loading, setLoading] = useState(true)
  const [rollbackOpen, setRollbackOpen] = useState(false)
  const [rolling, setRolling] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const logsRef = useRef<HTMLDivElement>(null)

  const load = async () => {
    try {
      const d = await getDeployment(id, deploymentId)
      setDeployment(d)
      return d
    } catch {
      return null
    }
  }

  useEffect(() => {
    if (authLoading) return
    Promise.all([load(), getProject(id)])
      .then(([, project]) => setIsCurrentDeployment(project.currentDeploymentId === deploymentId))
      .finally(() => setLoading(false))
  }, [id, deploymentId, authLoading])

  useEffect(() => {
    if (!deployment) return
    if (deployment.status === 'building' || deployment.status === 'pending') {
      pollingRef.current = setInterval(async () => {
        const d = await load()
        if (d && d.status !== 'building' && d.status !== 'pending') {
          clearInterval(pollingRef.current!)
        }
      }, 2000)
    }
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [deployment?.status])

  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight
    }
  }, [deployment?.logs])

  const handleRollback = async () => {
    setRolling(true)
    try {
      await rollbackDeployment(id, deploymentId)
      setRollbackOpen(false)
      toast('Rollback lancé avec succès.')
      router.push(`/projects/${id}/deployments`)
    } catch (err) {
      setRollbackOpen(false)
      toast(err instanceof Error ? err.message : 'Erreur lors du rollback.', 'error')
    } finally {
      setRolling(false)
    }
  }

  if (loading) return <Text size="3" style={{ color: 'var(--gray-9)' }}>Chargement…</Text>
  if (!deployment) return <Text size="3" style={{ color: 'var(--red-10)' }}>Déploiement introuvable.</Text>

  const isActive = deployment.status === 'building' || deployment.status === 'pending'

  return (
    <Box style={{ maxWidth: 900 }}>
      <Flex align="center" gap="3" mb="6" wrap="wrap">
        <Button
          variant="ghost"
          color="gray"
          size="1"
          style={{ cursor: 'pointer' }}
          onClick={() => router.back()}
        >
          ← Retour
        </Button>
        <Heading size="6" style={{ color: 'var(--gray-12)', fontWeight: 700 }}>
          Déploiement — {formatDate(deployment.createdAt)}
        </Heading>
        <StatusBadge status={deployment.status} />
        {isCurrentDeployment && <Badge color="blue" variant="soft">En production</Badge>}
        {deployment.status === 'success' && !isCurrentDeployment && (
          <Box style={{ marginLeft: 'auto' }}>
            <Button
              variant="outline"
              color="gray"
              size="2"
              style={{ cursor: 'pointer' }}
              onClick={() => setRollbackOpen(true)}
            >
              Publier cette version
            </Button>
          </Box>
        )}
      </Flex>

      <Box
        ref={logsRef}
        style={{
          background: 'var(--gray-2)',
          border: '1px solid var(--gray-4)',
          borderRadius: 0,
          padding: 16,
          height: '60vh',
          overflowY: 'auto',
          fontFamily: 'monospace',
          fontSize: 13,
          lineHeight: 1.6,
          color: 'var(--gray-12)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}
      >
        {deployment.logs ? (
          deployment.logs
        ) : isActive ? (
          <Text size="2" style={{ color: 'var(--gray-9)', fontFamily: 'monospace' }}>En attente des logs…</Text>
        ) : (
          <Text size="2" style={{ color: 'var(--gray-9)', fontFamily: 'monospace' }}>Aucun log disponible.</Text>
        )}
      </Box>

      <AlertDialog.Root open={rollbackOpen} onOpenChange={setRollbackOpen}>
        <AlertDialog.Content maxWidth="440px">
          <AlertDialog.Title>Publier cette version</AlertDialog.Title>
          <AlertDialog.Description size="2" mb="4">
            Le container sera recréé depuis l'image de ce déploiement. Toutes les données non persistées seront perdues. Cette action est irréversible.
          </AlertDialog.Description>
          <Flex gap="3" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray" disabled={rolling} style={{ cursor: 'pointer' }}>
                Annuler
              </Button>
            </AlertDialog.Cancel>
            <Button
              variant="solid"
              color="gray"
              highContrast
              disabled={rolling}
              style={{ cursor: rolling ? 'not-allowed' : 'pointer' }}
              onClick={handleRollback}
            >
              {rolling ? 'Publication en cours…' : 'Confirmer la publication'}
            </Button>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Box>
  )
}
