import { Box, Flex, Heading, Text } from '@radix-ui/themes'

export default function DashboardPage() {
  return (
    <Box>
      <Heading size="6" mb="5">Vue d'ensemble</Heading>

      <Box>
        <Heading size="3" mb="3">Projets</Heading>
        <Flex
          align="center"
          justify="center"
          style={{
            border: '1px dashed var(--gray-6)',
            padding: 32,
            cursor: 'pointer',
            borderRadius: 0,
          }}
        >
          <Text size="2" color="gray">+ Créer un projet</Text>
        </Flex>
      </Box>
    </Box>
  )
}
