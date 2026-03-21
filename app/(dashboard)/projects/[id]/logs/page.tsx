'use client'

import { useParams } from 'next/navigation'
import { Box, Heading, Text } from '@radix-ui/themes'
import { ProjectAccessGuard } from '@/app/components/ProjectAccessGuard'

export default function LogsPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <ProjectAccessGuard id={id}>
      <Box>
        <Heading size="6" mb="2" style={{ color: 'var(--gray-12)', fontWeight: 700 }}>
          Logs
        </Heading>
        <Text size="2" style={{ color: 'var(--gray-9)' }}>
          Logs en temps réel du projet.
        </Text>
      </Box>
    </ProjectAccessGuard>
  )
}
