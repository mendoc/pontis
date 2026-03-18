'use client'

import { Box, Heading, Text } from '@radix-ui/themes'

export default function NotificationsPage() {
  return (
    <Box>
      <Heading size="6" mb="2" style={{ color: 'var(--gray-12)', fontWeight: 700 }}>
        Notifications
      </Heading>
      <Text size="2" style={{ color: 'var(--gray-9)' }}>
        Configurer les alertes pour les événements du projet (build réussi, échec, etc.).
      </Text>
    </Box>
  )
}
