'use client'

import { Box, Heading, Text } from '@radix-ui/themes'

export default function AdminProjectsPage() {
  return (
    <Box>
      <Heading size="6" mb="2" style={{ color: 'var(--gray-12)', fontWeight: 700 }}>
        Projets
      </Heading>
      <Text size="2" style={{ color: 'var(--gray-9)' }}>
        Vue d'ensemble de tous les projets de la plateforme.
      </Text>
    </Box>
  )
}
