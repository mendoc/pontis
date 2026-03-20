'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Box, Flex, Heading, Text, Separator, Button, Badge, TextField, AlertDialog } from '@radix-ui/themes'
import { CopyIcon, CheckIcon, ReloadIcon, StopIcon, PlayIcon, Pencil1Icon } from '@radix-ui/react-icons'
import { useProjects, Project, Deployment } from '@/app/context/projects'
import { useAuth } from '@/app/context/auth'
import { useToast } from '@/app/components/Toast'
import { RedeployZone } from '@/app/components/RedeployZone'

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="ghost" color="gray" size="1" style={{ cursor: 'pointer', padding: '0 4px', height: 20 }} onClick={handleCopy}>
      {copied ? <CheckIcon style={{ color: 'var(--green-9)' }} /> : <CopyIcon style={{ color: 'var(--gray-8)' }} />}
    </Button>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Flex direction="column" gap="2">
      <Text size="2" weight="medium" style={{ color: 'var(--gray-10)' }}>{label}</Text>
      <Box>{children}</Box>
    </Flex>
  )
}

function RenameField({ initialName, onSave }: { initialName: string; onSave: (name: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(initialName)
  const [draft, setDraft] = useState(initialName)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { setName(initialName); setDraft(initialName) }, [initialName])

  const handleSave = async () => {
    const trimmed = draft.trim()
    if (!trimmed || trimmed === name) { setEditing(false); return }
    setSaving(true)
    setError(null)
    try {
      await onSave(trimmed)
      setName(trimmed)
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => { setDraft(name); setEditing(false); setError(null) }

  if (editing) {
    return (
      <Flex direction="column" gap="2">
        <Flex align="center" gap="3">
          <TextField.Root
            size="3"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel() }}
            autoFocus
            style={{ width: 240, height: 36 }}
            disabled={saving}
          />
          <Button size="2" variant="solid" color="gray" highContrast style={{ cursor: 'pointer', height: 36, padding: '0 16px', verticalAlign: 'middle' }} onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
          <Button size="2" variant="ghost" color="gray" style={{ cursor: 'pointer', height: 36, padding: '0 16px', verticalAlign: 'middle' }} onClick={handleCancel} disabled={saving}>
            Annuler
          </Button>
        </Flex>
        {error && <Text size="2" style={{ color: 'var(--red-10)' }}>{error}</Text>}
      </Flex>
    )
  }

  return (
    <Flex align="center" gap="3">
      <Text size="4" style={{ color: 'var(--gray-12)' }}>{name}</Text>
      <Button variant="ghost" color="gray" size="1" style={{ cursor: 'pointer', padding: '0 4px', height: 20 }} onClick={() => { setDraft(name); setEditing(true) }}>
        <Pencil1Icon style={{ color: 'var(--gray-8)' }} />
      </Button>
    </Flex>
  )
}

function DeploymentStatusBadge({ status }: { status: Deployment['status'] }) {
  if (status === 'success') return <Badge color="green" variant="soft">Succès</Badge>
  if (status === 'failed') return <Badge color="red" variant="soft">Échec</Badge>
  if (status === 'building') return <Badge color="orange" variant="soft">En cours</Badge>
  return <Badge color="gray" variant="soft">En attente</Badge>
}

function LastDeploymentField({ projectId, deployment }: { projectId: string; deployment: Deployment }) {
  const router = useRouter()
  const date = new Date(deployment.createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <Flex align="center" gap="3" style={{ flexWrap: 'wrap' }}>
      <DeploymentStatusBadge status={deployment.status} />
      <Text size="3" style={{ color: 'var(--gray-11)' }}>{date}</Text>
      <Button
        variant="ghost"
        color="gray"
        size="1"
        style={{ cursor: 'pointer', padding: '0 4px', height: 20 }}
        onClick={() => router.push(`/projects/${projectId}/deployments/${deployment.id}`)}
      >
        <Text size="2" style={{ color: 'var(--gray-10)' }}>Voir les logs →</Text>
      </Button>
    </Flex>
  )
}


function DeleteDialog({ projectSlug, projectId }: { projectSlug: string; projectId: string }) {
  const { deleteProject } = useProjects()
  const router = useRouter()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const handleDelete = async () => {
    if (input !== projectSlug) return
    setLoading(true)
    setError(null)
    try {
      await deleteProject(projectId)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression')
      setLoading(false)
    }
  }

  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialog.Trigger>
        <Button variant="outline" color="red" size="3" style={{ cursor: 'pointer' }}>
          Supprimer le projet
        </Button>
      </AlertDialog.Trigger>
      <AlertDialog.Content maxWidth="440px">
        <AlertDialog.Title>Supprimer le projet</AlertDialog.Title>
        <AlertDialog.Description size="2" mb="4">
          Cette action est irréversible. Le container, l'image Docker et toutes les données associées seront définitivement supprimés.
        </AlertDialog.Description>

        <Text size="2" mb="2" style={{ display: 'block' }}>
          Saisissez <strong>{projectSlug}</strong> pour confirmer :
        </Text>
        <TextField.Root
          size="2"
          placeholder={projectSlug}
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(null) }}
          disabled={loading}
          style={{ marginBottom: 12 }}
        />
        {error && <Text size="2" style={{ color: 'var(--red-10)', display: 'block', marginBottom: 8 }}>{error}</Text>}

        <Flex gap="3" justify="end">
          <AlertDialog.Cancel>
            <Button variant="soft" color="gray" disabled={loading} style={{ cursor: 'pointer' }}>
              Annuler
            </Button>
          </AlertDialog.Cancel>
          <Button
            variant="solid" color="red"
            disabled={input !== projectSlug || loading}
            style={{ cursor: input === projectSlug && !loading ? 'pointer' : 'not-allowed' }}
            onClick={handleDelete}
          >
            {loading ? 'Suppression…' : 'Supprimer définitivement'}
          </Button>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  )
}

export default function ProjectSettingsPage() {
  const { id } = useParams<{ id: string }>()
  const { getProject, renameProject, startProject, stopProject, restartProject, fetchDeployments } = useProjects()
  const { toast } = useToast()
  const [actionLoading, setActionLoading] = useState<'start' | 'stop' | 'restart' | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [restartOpen, setRestartOpen] = useState(false)
  const { isLoading: authLoading } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastDeployment, setLastDeployment] = useState<Deployment | null>(null)

  const loadLastDeployment = async () => {
    try {
      const page = await fetchDeployments(id, { limit: 1 })
      setLastDeployment(page.data[0] ?? null)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (authLoading) return
    Promise.all([
      getProject(id).then(setProject).catch(() => {}),
      loadLastDeployment(),
    ]).finally(() => setLoading(false))
  }, [id, authLoading])

  if (loading) {
    return <Text size="3" style={{ color: 'var(--gray-9)' }}>Chargement…</Text>
  }

  if (!project) {
    return <Text size="3" style={{ color: 'var(--red-10)' }}>Projet introuvable.</Text>
  }

  const createdAt = project.createdAt
    ? new Date(project.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—'

  return (
    <Box style={{ maxWidth: 800 }}>
      <Heading size="7" mb="2" style={{ color: 'var(--gray-12)', fontWeight: 700 }}>Configuration</Heading>
      <Text size="2" mb="6" style={{ color: 'var(--gray-9)', display: 'block' }}>
        Gérez les paramètres et le déploiement de votre projet.
      </Text>

      <Flex gap="8" align="start">
        {/* Colonne gauche — détails */}
        <Flex direction="column" gap="5" style={{ flex: 1 }}>
          <Field label="Nom">
            <RenameField
              initialName={project.name}
              onSave={(name) => renameProject(id, name).then((updated) => setProject(updated))}
            />
          </Field>

          <Field label="Slug">
            <Flex align="center" gap="3">
              <Text size="4" style={{ color: 'var(--gray-12)', fontFamily: 'monospace' }}>{project.slug}</Text>
              <CopyButton value={project.slug} />
            </Flex>
          </Field>

          <Field label="Sous-domaine">
            <Flex align="center" gap="3">
              {project.domain ? (
                <a href={`https://${project.domain}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 16, color: 'var(--gray-12)', textDecoration: 'none' }}>
                  https://{project.domain} ↗
                </a>
              ) : (
                <Text size="4" style={{ color: 'var(--gray-9)' }}>—</Text>
              )}
              {project.domain && <CopyButton value={project.domain} />}
            </Flex>
          </Field>

          <Field label="Statut">
            {project.status === 'running' && <Badge color="green" variant="soft">En ligne</Badge>}
            {project.status === 'building' && <Badge color="orange" variant="soft">En cours</Badge>}
            {project.status === 'failed' && <Badge color="red" variant="soft">Échoué</Badge>}
            {project.status === 'stopped' && <Badge color="gray" variant="soft">Arrêté</Badge>}
          </Field>

          <Field label="Créé le">
            <Text size="4" style={{ color: 'var(--gray-12)' }}>{createdAt}</Text>
          </Field>

          {project.restartedAt && (
            <Field label="Dernier redémarrage">
              <Text size="4" style={{ color: 'var(--gray-12)' }}>
                {new Date(project.restartedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </Text>
            </Field>
          )}

          {lastDeployment && (
            <Field label="Dernier déploiement">
              <LastDeploymentField projectId={id} deployment={lastDeployment} />
            </Field>
          )}
        </Flex>

        {/* Colonne droite — actions */}
        <Flex direction="column" gap="2" style={{ width: 200, flexShrink: 0, border: '1px solid var(--gray-4)', borderRadius: 6, padding: 16 }}>
          <Text size="2" style={{ color: 'var(--gray-9)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
            Actions
          </Text>
          {project.status === 'stopped' ? (
            <Button
              variant="outline" color="gray" size="3"
              disabled={actionLoading === 'start'}
              style={{ cursor: 'pointer', justifyContent: 'flex-start', gap: 8 }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--green-10)'; e.currentTarget.style.borderColor = 'var(--green-8)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = ''; e.currentTarget.style.borderColor = '' }}
              onClick={async () => {
                setActionLoading('start'); setActionError(null)
                try { setProject(await startProject(id)) }
                catch (err) { setActionError(err instanceof Error ? err.message : 'Erreur') }
                finally { setActionLoading(null) }
              }}
            >
              <PlayIcon />{actionLoading === 'start' ? 'Démarrage…' : 'Démarrer'}
            </Button>
          ) : (
            <Button
              variant="outline" color="gray" size="3"
              disabled={actionLoading === 'stop'}
              style={{ cursor: 'pointer', justifyContent: 'flex-start', gap: 8 }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--red-10)'; e.currentTarget.style.borderColor = 'var(--red-8)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = ''; e.currentTarget.style.borderColor = '' }}
              onClick={async () => {
                setActionLoading('stop'); setActionError(null)
                try { setProject(await stopProject(id)) }
                catch (err) { setActionError(err instanceof Error ? err.message : 'Erreur') }
                finally { setActionLoading(null) }
              }}
            >
              <StopIcon />{actionLoading === 'stop' ? 'Arrêt…' : 'Stopper'}
            </Button>
          )}
          <Button
            variant="outline" color="gray" size="3"
            disabled={actionLoading === 'restart' || project.status === 'stopped'}
            style={{ cursor: 'pointer', justifyContent: 'flex-start', gap: 8 }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--orange-10)'; e.currentTarget.style.borderColor = 'var(--orange-8)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = ''; e.currentTarget.style.borderColor = '' }}
            onClick={() => { setActionError(null); setRestartOpen(true) }}
          >
            <ReloadIcon />{actionLoading === 'restart' ? 'Redémarrage…' : 'Redémarrer'}
          </Button>
          {actionError && (
            <Text size="1" style={{ color: 'var(--red-10)' }}>{actionError}</Text>
          )}
        </Flex>
      </Flex>

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
                  const updated = await restartProject(id)
                  setProject(updated)
                  setRestartOpen(false)
                  toast(`${updated.name} a bien redémarré.`)
                } catch (err) {
                  setRestartOpen(false)
                  toast(err instanceof Error ? err.message : 'Erreur lors du redémarrage.', 'error')
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

      <Separator size="4" my="6" />

      {/* Redéploiement par ZIP */}
      <Flex direction="column" gap="3" mb="6">
        <Text size="3" weight="medium" style={{ color: 'var(--gray-12)' }}>Redéployer depuis un ZIP</Text>
        <Text size="3" style={{ color: 'var(--gray-9)' }}>
          Uploadez une nouvelle archive pour mettre à jour le site sans créer un nouveau projet.
        </Text>
        <RedeployZone projectId={id} onRedeployed={(updatedProject) => { setProject(updatedProject); loadLastDeployment() }} />
      </Flex>

      <Separator size="4" my="6" />

      {/* Zone de danger */}
      <Flex direction="column" gap="3">
        <Text size="3" weight="medium" style={{ color: 'var(--red-11)' }}>Zone de danger</Text>
        <Text size="3" style={{ color: 'var(--gray-12)' }}>
          La suppression du projet est irréversible. Le container et le domaine associé seront détruits.
        </Text>
        <Box>
          <DeleteDialog projectSlug={project.slug} projectId={id} />
        </Box>
      </Flex>
    </Box>
  )
}
