'use client'

import { Box, Heading, Text } from '@radix-ui/themes'

export default function EnvPage() {
  return (
    <Box>
      <Heading size="6" mb="2" style={{ color: 'var(--gray-12)', fontWeight: 700 }}>
        {"Variables d'environnement"}
      </Heading>
      <Text size="2" style={{ color: 'var(--gray-9)' }}>
        {"Variables d'environnement du projet."}
      </Text>
    </Box>
  )
}
