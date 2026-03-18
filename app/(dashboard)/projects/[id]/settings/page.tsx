'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Box, Flex, Heading, Text, Separator, Button, Badge, TextField, AlertDialog } from '@radix-ui/themes'
import { CopyIcon, CheckIcon, ReloadIcon, StopIcon, PlayIcon, Pencil1Icon, UploadIcon } from '@radix-ui/react-icons'
import { useProjects, Project } from '@/app/context/projects'
import { useAuth } from '@/app/context/auth'

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

function RedeployZone({ projectId }: { projectId: string }) {
  const { redeployProject, getProject } = useProjects()
  const [file, setFile] = useState<File | null>(null)
  const [phase, setPhase] = useState<'idle' | 'uploading' | 'building'>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected || !selected.name.endsWith('.zip')) return
    setFile(selected)
    setError(null)
    setSuccess(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const dropped = e.dataTransfer.files[0]
    if (!dropped || !dropped.name.endsWith('.zip')) return
    setFile(dropped)
    setError(null)
    setSuccess(false)
  }

  const handleRedeploy = async () => {
    if (!file) return
    setError(null)
    setSuccess(false)
    setPhase('uploading')
    setUploadProgress(0)
    try {
      const project = await redeployProject(projectId, file, (pct) => setUploadProgress(pct))

      setPhase('building')
      let status = project.status
      while (status === 'building') {
        await new Promise((r) => setTimeout(r, 2000))
        const updated = await getProject(projectId)
        status = updated.status
      }

      if (status === 'failed') {
        setError('Le build a échoué. Vérifiez votre archive ZIP.')
        return
      }

      setSuccess(true)
      setFile(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du redéploiement')
    } finally {
      setPhase('idle')
    }
  }

  const isActive = phase !== 'idle'

  return (
    <Flex direction="column" gap="3">
      <Flex
        align="center" justify="center" direction="column" gap="2"
        onDrop={isActive ? undefined : handleDrop}
        onDragOver={(e) => { if (!isActive) e.preventDefault() }}
        onClick={() => !isActive && fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${file ? 'var(--green-8)' : 'var(--gray-6)'}`,
          borderRadius: 6, padding: '20px 16px', cursor: isActive ? 'default' : 'pointer',
          backgroundColor: file ? 'var(--green-2)' : undefined,
          transition: 'border-color 0.15s, background-color 0.15s',
          opacity: isActive ? 0.5 : 1,
        }}
      >
        {file ? (
          <Text size="2" style={{ color: 'var(--green-11)' }}>{file.name} — {(file.size / 1024 / 1024).toFixed(2)} Mo</Text>
        ) : (
          <>
            <UploadIcon style={{ color: 'var(--gray-8)' }} />
            <Text size="2" style={{ color: 'var(--gray-10)' }}>Glissez un .zip ou cliquez <Text size="1" style={{ color: 'var(--gray-9)' }}>(max 50 Mo)</Text></Text>
          </>
        )}
      </Flex>
      <input ref={fileInputRef} type="file" accept=".zip" style={{ display: 'none' }} onChange={handleFileChange} />

      {phase === 'uploading' && (
        <Flex direction="column" gap="1">
          <Text size="2" style={{ color: 'var(--gray-10)' }}>Téléversement… {uploadProgress}%</Text>
          <Box style={{ height: 6, background: 'var(--gray-4)', borderRadius: 3, overflow: 'hidden' }}>
            <Box style={{ height: '100%', width: `${uploadProgress}%`, background: 'var(--gray-9)', transition: 'width 0.2s' }} />
          </Box>
        </Flex>
      )}

      {phase === 'building' && (
        <Text size="2" style={{ color: 'var(--gray-10)' }}>Build en cours…</Text>
      )}

      {error && <Text size="2" style={{ color: 'var(--red-10)' }}>{error}</Text>}
      {success && <Text size="2" style={{ color: 'var(--green-10)' }}>Redéploiement réussi.</Text>}

      <Button
        size="3" variant="solid" color="gray" highContrast
        disabled={!file || isActive}
        style={{ cursor: file && !isActive ? 'pointer' : 'not-allowed', alignSelf: 'flex-start' }}
        onClick={handleRedeploy}
      >
        Lancer le redéploiement
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
  const { getProject, renameProject, startProject, stopProject, restartProject } = useProjects()
  const [actionLoading, setActionLoading] = useState<'start' | 'stop' | 'restart' | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const { isLoading: authLoading } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    getProject(id).then(setProject).catch(() => {}).finally(() => setLoading(false))
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
      <Heading size="7" mb="6" style={{ color: 'var(--gray-12)', fontWeight: 700 }}>Configuration</Heading>

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
                  {project.domain} ↗
                </a>
              ) : (
                <Text size="4" style={{ color: 'var(--gray-9)' }}>—</Text>
              )}
              {project.domain && <CopyButton value={project.domain} />}
            </Flex>
          </Field>

          <Field label="Statut">
            {project.status === 'running' && <Badge color="green" variant="soft">running</Badge>}
            {project.status === 'building' && <Badge color="orange" variant="soft">building</Badge>}
            {project.status === 'failed' && <Badge color="red" variant="soft">failed</Badge>}
            {project.status === 'stopped' && <Badge color="gray" variant="soft">stopped</Badge>}
          </Field>

          <Field label="Créé le">
            <Text size="4" style={{ color: 'var(--gray-12)' }}>{createdAt}</Text>
          </Field>
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
            onClick={async () => {
              setActionLoading('restart'); setActionError(null)
              try { setProject(await restartProject(id)) }
              catch (err) { setActionError(err instanceof Error ? err.message : 'Erreur') }
              finally { setActionLoading(null) }
            }}
          >
            <ReloadIcon />{actionLoading === 'restart' ? 'Redémarrage…' : 'Redémarrer'}
          </Button>
          {actionError && (
            <Text size="1" style={{ color: 'var(--red-10)' }}>{actionError}</Text>
          )}
        </Flex>
      </Flex>

      <Separator size="4" my="6" />

      {/* Redéploiement par ZIP */}
      <Flex direction="column" gap="3" mb="6">
        <Text size="3" weight="medium" style={{ color: 'var(--gray-12)' }}>Redéployer depuis un ZIP</Text>
        <Text size="3" style={{ color: 'var(--gray-9)' }}>
          Uploadez une nouvelle archive pour mettre à jour le site sans créer un nouveau projet.
        </Text>
        <RedeployZone projectId={id} />
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
