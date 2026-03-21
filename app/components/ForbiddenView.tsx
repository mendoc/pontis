'use client'

import { Box, Flex, Heading, Text } from '@radix-ui/themes'
import { LockClosedIcon } from '@radix-ui/react-icons'

export function ForbiddenView({ message = "Vous n'avez pas les permissions nécessaires pour accéder à ce projet." }: { message?: string }) {
  return (
    <Flex direction="column" align="center" justify="center" style={{ height: '60vh', gap: 16 }}>
      <Box style={{ color: 'var(--gray-8)', display: 'flex' }}>
        <LockClosedIcon width={40} height={40} />
      </Box>
      <Heading size="4" style={{ color: 'var(--gray-11)', fontWeight: 600 }}>Accès refusé</Heading>
      <Text size="2" style={{ color: 'var(--gray-9)', textAlign: 'center', maxWidth: 320 }}>
        {message}
      </Text>
    </Flex>
  )
}
