'use client'

import { Box, Heading, Text } from '@radix-ui/themes'

export default function DeploymentsPage() {
  return (
    <Box>
      <Heading size="6" mb="2" style={{ color: 'var(--gray-12)', fontWeight: 700 }}>
        Déploiements
      </Heading>
      <Text size="2" style={{ color: 'var(--gray-9)' }}>
        Historique des déploiements du projet.
      </Text>
    </Box>
  )
}
