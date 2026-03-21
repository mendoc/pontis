'use client'

import { useParams } from 'next/navigation'
import { Box, Heading, Text } from '@radix-ui/themes'
import { ProjectAccessGuard } from '@/app/components/ProjectAccessGuard'

export default function EnvPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <ProjectAccessGuard id={id}>
      <Box>
        <Heading size="6" mb="2" style={{ color: 'var(--gray-12)', fontWeight: 700 }}>
          {"Variables d'environnement"}
        </Heading>
        <Text size="2" style={{ color: 'var(--gray-9)' }}>
          {"Variables d'environnement du projet."}
        </Text>
      </Box>
    </ProjectAccessGuard>
  )
}
