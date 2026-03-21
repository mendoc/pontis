'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Flex, Text, Button } from '@radix-ui/themes'
import { UploadIcon } from '@radix-ui/react-icons'
import { useProjects, Project } from '@/app/context/projects'
import { MAX_ZIP_SIZE_BYTES, MAX_ZIP_SIZE_MB } from '@/app/config'

interface RedeployZoneProps {
  projectId: string
  onRedeployed?: (updatedProject: Project, succeeded: boolean) => void
}

export function RedeployZone({ projectId, onRedeployed }: RedeployZoneProps) {
  const { redeployProject, getProject, getDeployment } = useProjects()
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [phase, setPhase] = useState<'idle' | 'uploading' | 'building'>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [deploymentId, setDeploymentId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (f: File): string | null => {
    if (!f.name.endsWith('.zip')) return 'Seuls les fichiers .zip sont acceptés.'
    if (f.size > MAX_ZIP_SIZE_BYTES) return `Le fichier ne doit pas dépasser ${MAX_ZIP_SIZE_MB} Mo.`
    return null
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    const err = validateFile(selected)
    if (err) { setError(err); setFile(null); return }
    setFile(selected)
    setError(null)
    setSuccess(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const dropped = e.dataTransfer.files[0]
    if (!dropped) return
    const err = validateFile(dropped)
    if (err) { setError(err); setFile(null); return }
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
      const result = await redeployProject(projectId, file, (pct) => setUploadProgress(pct))
      const newDeploymentId = result.deploymentId ?? null
      if (newDeploymentId) setDeploymentId(newDeploymentId)

      setPhase('building')

      // Poller le déploiement (statut fiable même après le fix de revert)
      let succeeded = false
      if (newDeploymentId) {
        let dep = await getDeployment(projectId, newDeploymentId)
        while (dep.status === 'building' || dep.status === 'pending') {
          await new Promise((r) => setTimeout(r, 2000))
          dep = await getDeployment(projectId, newDeploymentId)
        }
        succeeded = dep.status === 'success'
      } else {
        // Fallback sans deploymentId
        let proj = await getProject(projectId)
        while (proj.status === 'building') {
          await new Promise((r) => setTimeout(r, 2000))
          proj = await getProject(projectId)
        }
        succeeded = proj.status === 'running'
      }

      const updatedProject = await getProject(projectId)
      onRedeployed?.(updatedProject, succeeded)

      if (!succeeded) {
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
            <Text size="2" style={{ color: 'var(--gray-10)' }}>Glissez un .zip ou cliquez <Text size="1" style={{ color: 'var(--gray-9)' }}>(max {MAX_ZIP_SIZE_MB} Mo)</Text></Text>
          </>
        )}
      </Flex>
      <input ref={fileInputRef} type="file" accept=".zip" style={{ display: 'none' }} onChange={handleFileChange} />

      {phase === 'uploading' && (
        <Flex direction="column" gap="1">
          <Text size="2" style={{ color: 'var(--gray-10)' }}>{uploadProgress === 0 ? 'Initialisation…' : `Téléversement… ${uploadProgress}%`}</Text>
          <Box style={{ height: 6, background: 'var(--gray-4)', borderRadius: 3, overflow: 'hidden' }}>
            <Box style={{ height: '100%', width: `${uploadProgress}%`, background: 'var(--gray-9)', transition: 'width 0.2s' }} />
          </Box>
        </Flex>
      )}

      {phase === 'building' && (
        <Flex align="center" justify="between">
          <Text size="2" style={{ color: 'var(--gray-10)' }}>Build en cours…</Text>
          {deploymentId && (
            <button
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--gray-10)', fontSize: 12 }}
              onClick={() => router.push(`/projects/${projectId}/deployments/${deploymentId}`)}>
              Voir les logs →
            </button>
          )}
        </Flex>
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
