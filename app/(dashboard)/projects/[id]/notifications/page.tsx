'use client'

import { useParams } from 'next/navigation'
import { Box, Heading, Text } from '@radix-ui/themes'
import { ProjectAccessGuard } from '@/app/components/ProjectAccessGuard'

export default function NotificationsPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <ProjectAccessGuard id={id}>
      <Box>
        <Heading size="6" mb="2" style={{ color: 'var(--gray-12)', fontWeight: 700 }}>
          Notifications
        </Heading>
        <Text size="2" style={{ color: 'var(--gray-9)' }}>
          Configurer les alertes pour les événements du projet (build réussi, échec, etc.).
        </Text>
      </Box>
    </ProjectAccessGuard>
  )
}
