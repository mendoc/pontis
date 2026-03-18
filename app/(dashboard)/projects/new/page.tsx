'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Flex, Heading, Text, TextField, Button, Progress } from '@radix-ui/themes'
import { CheckIcon, Cross2Icon } from '@radix-ui/react-icons'
import { useProjects } from '@/app/context/projects'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

type Phase = 'idle' | 'uploading' | 'building' | 'ssl'

export default function NewProjectPage() {
  const router = useRouter()
  const { createProject, checkSlug, getProject } = useProjects()
  const [name, setName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [phase, setPhase] = useState<Phase>('idle')
  const [sslSecondsLeft, setSslSecondsLeft] = useState(30)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // État de la vérification du slug
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const slug = slugify(name)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (slug.length < 3) {
      setSlugStatus('idle')
      return
    }

    setSlugStatus('checking')
    debounceRef.current = setTimeout(async () => {
      try {
        const { available } = await checkSlug(slug)
        setSlugStatus(available ? 'available' : 'taken')
      } catch {
        setSlugStatus('idle')
      }
    }, 3000)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [slug])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    if (!selected.name.endsWith('.zip')) {
      setError('Seuls les fichiers .zip sont acceptés')
      setFile(null)
      return
    }
    if (selected.size > 50 * 1024 * 1024) {
      setError('Le fichier ne doit pas dépasser 50 Mo')
      setFile(null)
      return
    }
    setError(null)
    setFile(selected)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const dropped = e.dataTransfer.files[0]
    if (!dropped) return
    if (!dropped.name.endsWith('.zip')) {
      setError('Seuls les fichiers .zip sont acceptés')
      setFile(null)
      return
    }
    if (dropped.size > 50 * 1024 * 1024) {
      setError('Le fichier ne doit pas dépasser 50 Mo')
      setFile(null)
      return
    }
    setError(null)
    setFile(dropped)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Le nom du projet est requis')
      return
    }

    if (slug.length < 3) {
      setError("Le nom doit générer un slug d'au moins 3 caractères")
      return
    }

    if (slugStatus === 'taken') {
      setError('Ce sous-domaine est déjà pris')
      return
    }

    if (!file) {
      setError('Veuillez sélectionner un fichier ZIP')
      return
    }

    setSubmitting(true)
    setUploadProgress(0)
    setPhase('uploading')
    try {
      const project = await createProject(name.trim(), file, (pct) => setUploadProgress(pct))

      // Phase build : polling jusqu'à running ou failed
      setPhase('building')
      let status = project.status
      while (status === 'building') {
        await new Promise((r) => setTimeout(r, 2000))
        const updated = await getProject(project.id)
        status = updated.status
      }

      if (status === 'failed') {
        setError('Le build a échoué. Vérifiez votre archive ZIP.')
        return
      }

      // Phase SSL : countdown 30s
      setPhase('ssl')
      for (let i = 30; i > 0; i--) {
        setSslSecondsLeft(i)
        await new Promise((r) => setTimeout(r, 1000))
      }

      router.push(`/projects/${project.id}/settings`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setSubmitting(false)
      setPhase('idle')
    }
  }

  return (
    <Box style={{ maxWidth: 480 }}>
      <Heading size="6" mb="6" style={{ color: 'var(--gray-12)', fontWeight: 700 }}>
        Nouveau projet statique
      </Heading>

      <form onSubmit={handleSubmit}>
        <Box mb="4">
          <Text as="label" size="2" weight="medium" style={{ color: 'var(--gray-11)', display: 'block', marginBottom: 6 }}>
            Nom du projet
          </Text>
          <TextField.Root
            size="3"
            placeholder="mon-site"
            style={{ height: 44 }}
            value={name}
            onChange={(e) => { setName(e.target.value); setError(null) }}
            disabled={submitting}
          />
          {slug && (
            slug.length < 3 ? (
              <Text size="2" style={{ display: 'block', marginTop: 6, color: 'var(--red-9)' }}>
                Le nom doit générer un slug d'au moins 3 caractères
              </Text>
            ) : (
              <Flex align="center" gap="1" style={{ marginTop: 6 }}>
                <Text size="2">
                  <span style={{ color: 'var(--gray-12)', fontWeight: 500 }}>{slug}</span>
                  <span style={{ color: 'var(--gray-8)' }}>.app.ongoua.pro</span>
                </Text>
                {slugStatus === 'checking' && (
                  <Text size="1" style={{ color: 'var(--gray-8)' }}>…</Text>
                )}
                {slugStatus === 'available' && (
                  <CheckIcon style={{ color: 'var(--green-9)', flexShrink: 0 }} />
                )}
                {slugStatus === 'taken' && (
                  <Cross2Icon style={{ color: 'var(--red-9)', flexShrink: 0 }} />
                )}
              </Flex>
            )
          )}
        </Box>

        {slugStatus === 'available' && (
          <Box mb="5">
            <Flex align="baseline" justify="between" style={{ marginBottom: 6 }}>
              <Text as="label" size="2" weight="medium" style={{ color: 'var(--gray-11)' }}>
                Archive ZIP (dist, build, out…)
              </Text>
              <Text size="1" style={{ color: 'var(--gray-8)' }}>max 50 Mo</Text>
            </Flex>

            <Flex
              align="center"
              justify="center"
              direction="column"
              gap="2"
              onDrop={submitting ? undefined : handleDrop}
              onDragOver={(e) => { if (!submitting) e.preventDefault() }}
              onClick={() => { if (!submitting) fileInputRef.current?.click() }}
              style={{
                border: `2px dashed ${file ? 'var(--green-8)' : 'var(--gray-6)'}`,
                borderRadius: 6,
                padding: '24px 16px',
                cursor: submitting ? 'default' : 'pointer',
                backgroundColor: file ? 'var(--green-2)' : undefined,
                transition: 'border-color 0.15s, background-color 0.15s',
                opacity: submitting ? 0.5 : 1,
              }}
            >
              {file ? (
                <Text size="2" style={{ color: 'var(--green-11)' }}>
                  {file.name} — {(file.size / 1024 / 1024).toFixed(2)} Mo
                </Text>
              ) : (
                <>
                  <Text size="2" style={{ color: 'var(--gray-10)' }}>
                    Glissez un fichier .zip ici
                  </Text>
                  <Text size="1" style={{ color: 'var(--gray-8)' }}>
                    ou cliquez pour sélectionner
                  </Text>
                </>
              )}
            </Flex>

            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              style={{ display: 'none' }}
              disabled={submitting}
              onChange={handleFileChange}
            />
          </Box>
        )}

        {submitting && (
          <Box mb="4">
            <Flex justify="between" mb="1">
              <Text size="1" color="gray">
                {phase === 'uploading' && `Téléversement… ${uploadProgress}%`}
                {phase === 'building' && 'Build en cours…'}
                {phase === 'ssl' && 'Génération du certificat SSL…'}
              </Text>
              {phase === 'ssl' && (
                <Text size="1" color="gray">{sslSecondsLeft}s</Text>
              )}
            </Flex>
            <Progress value={phase === 'uploading' ? uploadProgress : 100} />
          </Box>
        )}

        {error && (
          <Box mb="4">
            <Text size="2" style={{ color: 'var(--red-10)' }}>{error}</Text>
          </Box>
        )}

        <Flex gap="3" align="center">
          {slugStatus === 'available' && (
            <Button
              type="submit"
              size="2"
              variant="solid"
              color="gray"
              highContrast
              disabled={submitting || !file}
              style={{ cursor: submitting ? 'not-allowed' : 'pointer', height: 36, padding: '0 16px', verticalAlign: 'middle' }}
            >
              {phase === 'uploading' && 'Téléversement…'}
              {phase === 'building' && 'Build en cours…'}
              {phase === 'ssl' && 'Déploiement…'}
              {phase === 'idle' && 'Créer le projet'}
            </Button>
          )}
          <Button
            type="button"
            size="2"
            variant="ghost"
            color="gray"
            disabled={submitting}
            style={{ cursor: 'pointer', height: 36, padding: '0 16px', verticalAlign: 'middle', margin: 0 }}
            onClick={() => router.push('/dashboard')}
          >
            Annuler
          </Button>
        </Flex>
      </form>
    </Box>
  )
}
