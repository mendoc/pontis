'use client'

import { Box, Heading, Text } from '@radix-ui/themes'

export default function AdminContainersPage() {
  return (
    <Box>
      <Heading size="6" mb="2" style={{ color: 'var(--gray-12)', fontWeight: 700 }}>
        Containers
      </Heading>
      <Text size="2" style={{ color: 'var(--gray-9)' }}>
        État et gestion des containers Docker de la plateforme.
      </Text>
    </Box>
  )
}
