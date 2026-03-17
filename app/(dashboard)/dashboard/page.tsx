import type { Metadata } from 'next'
import { Box, Flex, Heading, Text } from '@radix-ui/themes'

export const metadata: Metadata = { title: 'Dashboard — Pontis' }

export default function DashboardPage() {
  return (
    <Box>
      <Heading size="7" mb="6" style={{ color: 'var(--gray-12)', fontWeight: 700 }}>
        Vue d'ensemble
      </Heading>

      <Box mb="6">
        <Heading size="3" mb="3" style={{ color: 'var(--gray-12)' }}>
          Projets
        </Heading>
        <Flex
          align="center"
          justify="center"
          style={{
            width: 280,
            height: 80,
            border: '1px dashed var(--gray-6)',
            cursor: 'pointer',
            borderRadius: 4,
          }}
        >
          <Text size="2" style={{ color: 'var(--gray-10)' }}>+ Créer un projet</Text>
        </Flex>
      </Box>
    </Box>
  )
}
