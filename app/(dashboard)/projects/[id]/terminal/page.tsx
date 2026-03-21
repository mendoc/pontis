'use client'

import { useParams } from 'next/navigation'
import { Box, Heading, Text } from '@radix-ui/themes'
import { ProjectAccessGuard } from '@/app/components/ProjectAccessGuard'

export default function TerminalPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <ProjectAccessGuard id={id}>
      <Box>
        <Heading size="6" mb="2" style={{ color: 'var(--gray-12)', fontWeight: 700 }}>
          Terminal
        </Heading>
        <Text size="2" style={{ color: 'var(--gray-9)' }}>
          Terminal interactif du projet.
        </Text>
      </Box>
    </ProjectAccessGuard>
  )
}
