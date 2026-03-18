'use client'

import { Box, Heading, Text } from '@radix-ui/themes'

export default function TerminalPage() {
  return (
    <Box>
      <Heading size="6" mb="2" style={{ color: 'var(--gray-12)', fontWeight: 700 }}>
        Terminal
      </Heading>
      <Text size="2" style={{ color: 'var(--gray-9)' }}>
        Terminal interactif du projet.
      </Text>
    </Box>
  )
}
