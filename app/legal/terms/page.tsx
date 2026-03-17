import Link from 'next/link'
import { Box, Flex, Heading, Text } from '@radix-ui/themes'

export const metadata = { title: 'Conditions d\'utilisation — Pontis' }

export default function TermsPage() {
  return (
    <Flex
      justify="center"
      style={{ minHeight: '100vh', backgroundColor: 'var(--color-background)', padding: '60px 20px' }}
    >
      <Box style={{ maxWidth: 720, width: '100%' }}>
        <Flex direction="column" gap="6">
          <Flex direction="column" gap="2">
            <Link href="/login" style={{ fontSize: 13, color: 'var(--gray-10)' }}>
              ← Retour
            </Link>
            <Heading size="7" weight="bold">Conditions d&apos;utilisation</Heading>
            <Text size="2" color="gray">Dernière mise à jour : 17 mars 2026</Text>
          </Flex>

          <Section title="1. Acceptation des conditions">
            En accédant à Pontis ou en utilisant nos services, vous acceptez d&apos;être lié par ces Conditions
            d&apos;utilisation. Si vous n&apos;acceptez pas ces conditions, vous ne devez pas utiliser Pontis.
          </Section>

          <Section title="2. Description du service">
            Pontis est une plateforme d&apos;hébergement et de déploiement continu auto-hébergée destinée aux
            développeurs et équipes souhaitant gérer leurs applications web. Le service est fourni tel quel, dans
            le cadre d&apos;une infrastructure interne.
          </Section>

          <Section title="3. Compte utilisateur">
            Vous êtes responsable de la confidentialité de vos identifiants de connexion. Vous vous engagez à
            nous informer immédiatement de toute utilisation non autorisée de votre compte. Nous nous réservons
            le droit de suspendre ou de résilier un compte en cas de violation de ces conditions.
          </Section>

          <Section title="4. Utilisation acceptable">
            Vous acceptez de ne pas utiliser Pontis pour des activités illégales, pour héberger des contenus
            malveillants, ou pour toute action pouvant perturber le bon fonctionnement de la plateforme ou
            porter atteinte à d&apos;autres utilisateurs.
          </Section>

          <Section title="5. Propriété intellectuelle">
            Le code source, les marques, logos et interfaces de Pontis sont la propriété de leurs auteurs
            respectifs. L&apos;utilisation du service ne vous confère aucun droit de propriété sur ces éléments.
          </Section>

          <Section title="6. Limitation de responsabilité">
            Dans les limites permises par la loi applicable, Pontis est fourni sans garantie d&apos;aucune sorte.
            Nous ne saurions être tenus responsables de pertes de données, interruptions de service ou dommages
            indirects résultant de l&apos;utilisation de la plateforme.
          </Section>

          <Section title="7. Modifications">
            Ces conditions peuvent être modifiées à tout moment. En continuant à utiliser Pontis après une
            modification, vous acceptez les nouvelles conditions.
          </Section>

          <Section title="8. Contact">
            Pour toute question relative à ces conditions, contactez l&apos;administrateur de votre instance Pontis.
          </Section>
        </Flex>
      </Box>
    </Flex>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Flex direction="column" gap="2">
      <Heading size="4" weight="medium">{title}</Heading>
      <Text size="2" color="gray" style={{ lineHeight: 1.7 }}>
        {children}
      </Text>
    </Flex>
  )
}
