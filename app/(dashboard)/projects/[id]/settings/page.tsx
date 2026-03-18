'use client'

import { useRef, useState } from 'react'
import { Box, Flex, Heading, Text, Separator, Button, Badge, TextField } from '@radix-ui/themes'
import { CopyIcon, CheckIcon, ReloadIcon, StopIcon, Pencil1Icon, UploadIcon } from '@radix-ui/react-icons'

// Données statiques — à connecter à l'API
const project = {
  name: 'Mon site',
  slug: 'mon-site',
  domain: 'mon-site.app.ongoua.pro',
  status: 'running',
  createdAt: '2025-03-10T14:32:00Z',
  lastDeploy: {
    status: 'success',
    deployedAt: '2026-03-18T07:12:00Z',
  },
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      variant="ghost"
      color="gray"
      size="1"
      style={{ cursor: 'pointer', padding: '0 4px', height: 20 }}
      onClick={handleCopy}
    >
      {copied
        ? <CheckIcon style={{ color: 'var(--green-9)' }} />
        : <CopyIcon style={{ color: 'var(--gray-8)' }} />
      }
    </Button>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Flex direction="column" gap="2">
      <Text size="2" weight="medium" style={{ color: 'var(--gray-10)' }}>
        {label}
      </Text>
      <Box>{children}</Box>
    </Flex>
  )
}

function RenameField({ initialName }: { initialName: string }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(initialName)
  const [draft, setDraft] = useState(initialName)

  const handleSave = () => {
    setName(draft.trim() || name)
    setEditing(false)
  }

  const handleCancel = () => {
    setDraft(name)
    setEditing(false)
  }

  if (editing) {
    return (
      <Flex align="center" gap="3">
        <TextField.Root
          size="3"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') handleCancel()
          }}
          autoFocus
          style={{ width: 240, height: 48 }}
        />
        <Button size="2" variant="solid" color="gray" highContrast style={{ cursor: 'pointer' }} onClick={handleSave}>
          Enregistrer
        </Button>
        <Button size="2" variant="ghost" color="gray" style={{ cursor: 'pointer' }} onClick={handleCancel}>
          Annuler
        </Button>
      </Flex>
    )
  }

  return (
    <Flex align="center" gap="3">
      <Text size="4" style={{ color: 'var(--gray-12)' }}>{name}</Text>
      <Button
        variant="ghost"
        color="gray"
        size="1"
        style={{ cursor: 'pointer', padding: '0 4px', height: 20 }}
        onClick={() => { setDraft(name); setEditing(true) }}
      >
        <Pencil1Icon style={{ color: 'var(--gray-8)' }} />
      </Button>
    </Flex>
  )
}

function RedeployZone() {
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected || !selected.name.endsWith('.zip')) return
    setFile(selected)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const dropped = e.dataTransfer.files[0]
    if (!dropped || !dropped.name.endsWith('.zip')) return
    setFile(dropped)
  }

  return (
    <Flex direction="column" gap="3">
      <Flex
        align="center"
        justify="center"
        direction="column"
        gap="2"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${file ? 'var(--green-8)' : 'var(--gray-6)'}`,
          borderRadius: 6,
          padding: '20px 16px',
          cursor: 'pointer',
          backgroundColor: file ? 'var(--green-2)' : undefined,
          transition: 'border-color 0.15s, background-color 0.15s',
        }}
      >
        {file ? (
          <Text size="2" style={{ color: 'var(--green-11)' }}>
            {file.name} — {(file.size / 1024 / 1024).toFixed(2)} Mo
          </Text>
        ) : (
          <>
            <UploadIcon style={{ color: 'var(--gray-8)' }} />
            <Text size="2" style={{ color: 'var(--gray-10)' }}>Glissez un .zip ou cliquez</Text>
          </>
        )}
      </Flex>
      <input ref={fileInputRef} type="file" accept=".zip" style={{ display: 'none' }} onChange={handleFileChange} />
      <Button
        size="2"
        variant="solid"
        color="gray"
        highContrast
        size="3"
        disabled={!file}
        style={{ cursor: file ? 'pointer' : 'not-allowed', alignSelf: 'flex-start' }}
      >
        Lancer le redéploiement
      </Button>
    </Flex>
  )
}

export default function ProjectSettingsPage() {
  const createdAt = new Date(project.createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  const deployedAt = new Date(project.lastDeploy.deployedAt).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <Box style={{ maxWidth: 800 }}>
      <Heading size="7" mb="6" style={{ color: 'var(--gray-12)', fontWeight: 700 }}>
        Configuration
      </Heading>

      <Flex gap="8" align="start">
        {/* Colonne gauche — détails */}
        <Flex direction="column" gap="5" style={{ flex: 1 }}>
          <Field label="Nom">
            <RenameField initialName={project.name} />
          </Field>

          <Field label="Slug">
            <Flex align="center" gap="3">
              <Text size="4" style={{ color: 'var(--gray-12)', fontFamily: 'monospace' }}>{project.slug}</Text>
              <CopyButton value={project.slug} />
            </Flex>
          </Field>

          <Field label="Sous-domaine">
            <Flex align="center" gap="3">
              <a
                href={`https://${project.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 16, color: 'var(--gray-12)', textDecoration: 'none' }}
              >
                {project.domain} ↗
              </a>
              <CopyButton value={project.domain} />
            </Flex>
          </Field>

          <Field label="Statut">
            {project.status === 'running' && <Badge color="green" variant="soft">running</Badge>}
            {project.status === 'building' && <Badge color="orange" variant="soft">building</Badge>}
            {project.status === 'failed' && <Badge color="red" variant="soft">failed</Badge>}
            {project.status === 'stopped' && <Badge color="gray" variant="soft">stopped</Badge>}
          </Field>

          <Field label="Dernier déploiement">
            <Flex direction="column" gap="1">
              <Flex align="center" gap="2">
                {project.lastDeploy.status === 'success' && <Badge color="green" variant="soft">Succès</Badge>}
                {project.lastDeploy.status === 'failed' && <Badge color="red" variant="soft">Échec</Badge>}
                <Text size="3" style={{ color: 'var(--gray-12)' }}>{deployedAt}</Text>
              </Flex>
              <a href="./logs" style={{ fontSize: 14, color: 'var(--accent-9)', textDecoration: 'none' }}>
                Voir les logs →
              </a>
            </Flex>
          </Field>

          <Field label="Créé le">
            <Text size="4" style={{ color: 'var(--gray-12)' }}>{createdAt}</Text>
          </Field>
        </Flex>

        {/* Colonne droite — actions */}
        <Flex
          direction="column"
          gap="2"
          style={{
            width: 200,
            flexShrink: 0,
            border: '1px solid var(--gray-4)',
            borderRadius: 6,
            padding: 16,
          }}
        >
          <Text size="2" style={{ color: 'var(--gray-9)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
            Actions
          </Text>
          <Button variant="outline" color="gray" size="3" style={{ cursor: 'pointer', justifyContent: 'flex-start', gap: 8 }}>
            <ReloadIcon />
            Redéployer
          </Button>
          <Button variant="outline" color="gray" size="3" style={{ cursor: 'pointer', justifyContent: 'flex-start', gap: 8 }}>
            <StopIcon />
            Stopper
          </Button>
          <Button variant="outline" color="gray" size="3" style={{ cursor: 'pointer', justifyContent: 'flex-start', gap: 8 }}>
            <ReloadIcon style={{ transform: 'scaleX(-1)' }} />
            Redémarrer
          </Button>
        </Flex>
      </Flex>

      <Separator size="4" my="6" />

      {/* Redéploiement par ZIP */}
      <Flex direction="column" gap="3" mb="6">
        <Text size="3" weight="medium" style={{ color: 'var(--gray-12)' }}>Redéployer depuis un ZIP</Text>
        <Text size="3" style={{ color: 'var(--gray-9)' }}>
          Uploadez une nouvelle archive pour mettre à jour le site sans créer un nouveau projet.
        </Text>
        <RedeployZone />
      </Flex>

      <Separator size="4" my="6" />

      {/* Zone de danger */}
      <Flex direction="column" gap="3">
        <Text size="3" weight="medium" style={{ color: 'var(--red-11)' }}>Zone de danger</Text>
        <Text size="3" style={{ color: 'var(--gray-12)' }}>
          La suppression du projet est irréversible. Le container et le domaine associé seront détruits.
        </Text>
        <Box>
          <Button variant="outline" color="red" size="3" style={{ cursor: 'pointer' }}>
            Supprimer le projet
          </Button>
        </Box>
      </Flex>
    </Box>
  )
}
