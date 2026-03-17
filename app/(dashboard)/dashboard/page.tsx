'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Flex, Heading, Text, Button, Badge } from '@radix-ui/themes'
import { useProjects, Project } from '@/app/context/projects'
import { useAuth } from '@/app/context/auth'

function StatusBadge({ status }: { status: string }) {
  if (status === 'running') return <Badge color="green" variant="soft">{status}</Badge>
  if (status === 'building') return <Badge color="orange" variant="soft">{status}</Badge>
  if (status === 'failed') return <Badge color="red" variant="soft">{status}</Badge>
  return <Badge color="gray" variant="soft">{status}</Badge>
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <Box
      style={{
        border: '1px solid var(--gray-5)',
        borderRadius: 6,
        padding: '16px 20px',
        backgroundColor: 'var(--color-panel-solid)',
        minWidth: 240,
        maxWidth: 320,
      }}
    >
      <Flex justify="between" align="start" mb="2">
        <Text size="3" weight="medium" style={{ color: 'var(--gray-12)' }}>
          {project.name}
        </Text>
        <StatusBadge status={project.status} />
      </Flex>
{project.status === 'running' && project.domain && (
        <a
          href={`https://${project.domain}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 12, color: 'var(--accent-9)', textDecoration: 'none' }}
        >
          {project.domain} ↗
        </a>
      )}
    </Box>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { fetchProjects } = useProjects()
  const { isLoading: authLoading } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  // Toujours pointer vers la dernière version de fetchProjects sans re-créer l'effet
  const fetchRef = useRef(fetchProjects)
  fetchRef.current = fetchProjects

  useEffect(() => {
    // Attendre que l'auth soit initialisée avant de fetcher
    if (authLoading) return

    let active = true
    let intervalId: ReturnType<typeof setInterval> | null = null

    const load = async () => {
      try {
        const data = await fetchRef.current()
        if (!active) return
        setProjects(data)

        // Démarrer ou arrêter le polling selon le statut des projets
        const hasBuilding = data.some((p) => p.status === 'building')
        if (hasBuilding && !intervalId) {
          intervalId = setInterval(load, 3000)
        } else if (!hasBuilding && intervalId) {
          clearInterval(intervalId)
          intervalId = null
        }
      } catch {
        // silencieux
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
      if (intervalId) clearInterval(intervalId)
    }
  }, [authLoading])

  return (
    <Box>
      <Flex justify="between" align="center" mb="6">
        <Heading size="7" style={{ color: 'var(--gray-12)', fontWeight: 700 }}>
          Vue d'ensemble
        </Heading>
        <Button
          size="2"
          variant="solid"
          color="gray"
          highContrast
          style={{ cursor: 'pointer' }}
          onClick={() => router.push('/projects/new')}
        >
          + Nouveau projet
        </Button>
      </Flex>

      <Box mb="6">
        <Heading size="3" mb="4" style={{ color: 'var(--gray-12)' }}>
          Projets
        </Heading>

        {loading ? (
          <Text size="2" style={{ color: 'var(--gray-9)' }}>Chargement...</Text>
        ) : projects.length === 0 ? (
          <Flex
            align="center"
            justify="center"
            style={{
              width: 280,
              height: 80,
              border: '1px dashed var(--gray-6)',
              cursor: 'pointer',
              borderRadius: 4,
            }}
            onClick={() => router.push('/projects/new')}
          >
            <Text size="2" style={{ color: 'var(--gray-10)' }}>+ Créer un projet</Text>
          </Flex>
        ) : (
          <Flex wrap="wrap" gap="4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </Flex>
        )}
      </Box>
    </Box>
  )
}
