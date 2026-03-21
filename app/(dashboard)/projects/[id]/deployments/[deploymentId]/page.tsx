'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Box, Flex, Heading, Text, Badge, Button, AlertDialog } from '@radix-ui/themes'
import { ArrowLeftIcon, ArrowUpIcon, ArrowDownIcon, CopyIcon, CheckIcon } from '@radix-ui/react-icons'
import { useAuth } from '@/app/context/auth'
import { useProjects, Deployment } from '@/app/context/projects'
import { useToast } from '@/app/components/Toast'
import { ForbiddenView } from '@/app/components/ForbiddenView'

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
  const searchParams = useSearchParams()
  const isNewProject = searchParams.get('newProject') === '1'
  const { getDeployment, rollbackDeployment, getProject, deleteDeployment } = useProjects()
  const { isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  const [deployment, setDeployment] = useState<Deployment | null>(null)
  const [isCurrentDeployment, setIsCurrentDeployment] = useState(false)
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)
  const [rollbackOpen, setRollbackOpen] = useState(false)
  const [rolling, setRolling] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sslCountdown, setSslCountdown] = useState<number | null>(null)
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
    Promise.all([load(), getProject(id).catch((err) => {
      if (err instanceof Error && err.message === 'FORBIDDEN') setForbidden(true)
      throw err
    })])
      .then(([, project]) => {
        setIsCurrentDeployment(project.currentDeploymentId === deploymentId)
        document.title = `Déploiement | ${project.name} | Pontis`
      })
      .catch(() => {})
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

  useEffect(() => {
    if (!isNewProject || deployment?.status !== 'success') return
    let s = 30
    setSslCountdown(s)
    const interval = setInterval(() => {
      s -= 1
      setSslCountdown(s)
      if (s <= 0) {
        clearInterval(interval)
        router.push(`/projects/${id}/settings`)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [deployment?.status, isNewProject])

  const handleRollback = async () => {
    setRolling(true)
    try {
      await rollbackDeployment(id, deploymentId)
      setRollbackOpen(false)
      toast('Version publiée avec succès.')
      setIsCurrentDeployment(true)
    } catch (err) {
      setRollbackOpen(false)
      toast(err instanceof Error ? err.message : 'Erreur lors de la publication.', 'error')
    } finally {
      setRolling(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteDeployment(id, deploymentId)
      toast('Déploiement supprimé.')
      router.push(`/projects/${id}/deployments`)
    } catch (err) {
      setDeleteOpen(false)
      toast(err instanceof Error ? err.message : 'Erreur lors de la suppression.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <Text size="3" style={{ color: 'var(--gray-9)' }}>Chargement…</Text>
  if (forbidden) return <ForbiddenView />
  if (!deployment) return <Text size="3" style={{ color: 'var(--red-10)' }}>Déploiement introuvable.</Text>

  const isActive = deployment.status === 'building' || deployment.status === 'pending'

  return (
    <Box>
      <Box style={{ maxWidth: 900 }}>
      <Button
        variant="ghost"
        color="gray"
        size="1"
        mb="4"
        style={{ cursor: 'pointer', marginLeft: -6 }}
        onClick={() => router.back()}
      >
        <ArrowLeftIcon /> Retour
      </Button>
      <Flex align="center" gap="3" mb="2" wrap="wrap">
        <Heading size="6" style={{ color: 'var(--gray-12)', fontWeight: 700 }}>
          Déploiement — {formatDate(deployment.createdAt)}
        </Heading>
        <StatusBadge status={deployment.status} />
        {isCurrentDeployment && <Badge color="blue" variant="soft">En production</Badge>}
      </Flex>
      {deployment.deployedBy && (
        <Text size="2" mb="5" style={{ color: 'var(--gray-9)', display: 'block' }}>
          Déployé par{' '}
          <span style={{ color: 'var(--gray-11)', fontFamily: 'monospace' }}>
            {deployment.deployedBy.name ?? deployment.deployedBy.email}
          </span>
        </Text>
      )}
      </Box>

      {/* Bandeau SSL */}
      {sslCountdown !== null && (
        <Flex align="center" justify="between" mb="4" style={{ padding: '10px 14px', background: 'var(--gray-3)', border: '1px solid var(--gray-4)' }}>
          <Text size="2" style={{ color: 'var(--gray-11)' }}>Génération du certificat SSL en cours…</Text>
          <Text size="2" style={{ color: 'var(--gray-9)', fontFamily: 'monospace' }}>{sslCountdown}s</Text>
        </Flex>
      )}

      {/* Boutons d'action */}
      {(!isCurrentDeployment && (deployment.status === 'success' || deployment.status === 'failed')) && (
        <Flex gap="2" mb="4">
          {deployment.status === 'success' && (
            <Button variant="outline" color="gray" size="2" style={{ cursor: 'pointer' }} onClick={() => setRollbackOpen(true)}>
              Publier cette version
            </Button>
          )}
          <Button variant="outline" color="red" size="2" style={{ cursor: 'pointer' }} onClick={() => setDeleteOpen(true)}>
            Supprimer
          </Button>
        </Flex>
      )}

      {/* Barre de titre des logs */}
      <Flex
        align="center"
        justify="between"
        style={{
          border: '1px solid var(--gray-4)',
          borderBottom: 'none',
          padding: '8px 12px',
          background: 'var(--gray-3)',
        }}
      >
        <Text size="2" weight="medium" style={{ color: 'var(--gray-11)' }}>Logs de déploiement</Text>
        <Flex align="center" gap="5">
          <Button
            size="1" variant="ghost" color={copied ? 'green' : 'gray'}
            style={{ cursor: 'pointer' }}
            onClick={() => {
              if (deployment.logs) {
                navigator.clipboard.writeText(deployment.logs)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }
            }}
          >
            {copied ? <><CheckIcon /> Copié</> : <><CopyIcon /> Copier</>}
          </Button>
          <Button
            size="1" variant="ghost" color="gray"
            title="Aller en haut"
            style={{ cursor: 'pointer' }}
            onClick={() => { if (logsRef.current) logsRef.current.scrollTop = 0 }}
          >
            <ArrowUpIcon />
          </Button>
          <Button
            size="1" variant="ghost" color="gray"
            title="Aller en bas"
            style={{ cursor: 'pointer' }}
            onClick={() => { if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight }}
          >
            <ArrowDownIcon />
          </Button>
        </Flex>
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

      <AlertDialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialog.Content maxWidth="440px">
          <AlertDialog.Title>Supprimer ce déploiement</AlertDialog.Title>
          <AlertDialog.Description size="2" mb="4">
            L'image Docker associée sera supprimée définitivement. Cette action est irréversible.
          </AlertDialog.Description>
          <Flex gap="3" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray" disabled={deleting} style={{ cursor: 'pointer' }}>
                Annuler
              </Button>
            </AlertDialog.Cancel>
            <Button
              variant="solid"
              color="red"
              disabled={deleting}
              style={{ cursor: deleting ? 'not-allowed' : 'pointer' }}
              onClick={handleDelete}
            >
              {deleting ? 'Suppression…' : 'Supprimer'}
            </Button>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Box>
  )
}
