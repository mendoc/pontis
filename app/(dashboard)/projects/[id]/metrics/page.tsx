'use client'

import { Box, Heading, Text } from '@radix-ui/themes'

export default function MetricsPage() {
  return (
    <Box>
      <Heading size="6" mb="2" style={{ color: 'var(--gray-12)', fontWeight: 700 }}>
        Métriques
      </Heading>
      <Text size="2" style={{ color: 'var(--gray-9)' }}>
        Consommation CPU, mémoire, I/O et requêtes HTTP du projet.
      </Text>
    </Box>
  )
}
