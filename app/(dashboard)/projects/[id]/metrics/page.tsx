'use client'

import { useParams } from 'next/navigation'
import { Box, Heading, Text } from '@radix-ui/themes'
import { ProjectAccessGuard } from '@/app/components/ProjectAccessGuard'

export default function MetricsPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <ProjectAccessGuard id={id}>
      <Box>
        <Heading size="6" mb="2" style={{ color: 'var(--gray-12)', fontWeight: 700 }}>
          Métriques
        </Heading>
        <Text size="2" style={{ color: 'var(--gray-9)' }}>
          Consommation CPU, mémoire, I/O et requêtes HTTP du projet.
        </Text>
      </Box>
    </ProjectAccessGuard>
  )
}
