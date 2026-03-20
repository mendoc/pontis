'use client'

import { useEffect } from 'react'
import { Box, Heading, Text } from '@radix-ui/themes'

export default function AdminRolesPage() {
  useEffect(() => { document.title = 'Rôles et permissions | Pontis' }, [])

  return (
    <Box>
      <Heading size="6" mb="2" style={{ color: 'var(--gray-12)', fontWeight: 700 }}>
        Rôles et permissions
      </Heading>
      <Text size="2" style={{ color: 'var(--gray-9)' }}>
        Gestion des rôles et des permissions des utilisateurs.
      </Text>
    </Box>
  )
}
