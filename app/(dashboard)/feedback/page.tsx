'use client'

import { Box, Heading, Text } from '@radix-ui/themes'

export default function FeedbackPage() {
  return (
    <Box>
      <Heading size="6" mb="2" style={{ color: 'var(--gray-12)', fontWeight: 700 }}>
        Feedback
      </Heading>
      <Text size="2" style={{ color: 'var(--gray-9)' }}>
        Partagez vos retours pour améliorer Pontis.
      </Text>
    </Box>
  )
}
