'use client'

import { useEffect } from 'react'
import { Box, Heading, Text } from '@radix-ui/themes'

export default function AdminLogsPage() {
  useEffect(() => { document.title = 'Logs système | Administration | Pontis' }, [])

  return (
    <Box>
      <Heading size="6" mb="2" style={{ color: 'var(--gray-12)', fontWeight: 700 }}>
        Logs système
      </Heading>
      <Text size="2" style={{ color: 'var(--gray-9)' }}>
        Journaux d'activité de la plateforme.
      </Text>
    </Box>
  )
}
