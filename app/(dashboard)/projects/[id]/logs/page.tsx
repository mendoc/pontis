'use client'

import { Box, Heading, Text } from '@radix-ui/themes'

export default function LogsPage() {
  return (
    <Box>
      <Heading size="6" mb="2" style={{ color: 'var(--gray-12)', fontWeight: 700 }}>
        Logs
      </Heading>
      <Text size="2" style={{ color: 'var(--gray-9)' }}>
        Logs en temps réel du projet.
      </Text>
    </Box>
  )
}
