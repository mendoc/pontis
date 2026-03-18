'use client'

import { Box, Heading, Text } from '@radix-ui/themes'

export default function ProfilePage() {
  return (
    <Box>
      <Heading size="6" mb="2" style={{ color: 'var(--gray-12)', fontWeight: 700 }}>
        Mon profil
      </Heading>
      <Text size="2" style={{ color: 'var(--gray-9)' }}>
        Informations et préférences du compte.
      </Text>
    </Box>
  )
}
