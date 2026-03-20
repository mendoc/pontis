'use client'

import { Box, Heading, Text } from '@radix-ui/themes'

export default function AnalysisPage() {
  return (
    <Box>
      <Heading size="6" mb="2" style={{ color: 'var(--gray-12)', fontWeight: 700 }}>
        Analyse
      </Heading>
      <Text size="2" style={{ color: 'var(--gray-9)' }}>
        Sécurité, CVE, qualité de code et couverture de tests du projet.
      </Text>
    </Box>
  )
}
