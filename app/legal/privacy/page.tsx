import Link from 'next/link'
import { Box, Flex, Heading, Text } from '@radix-ui/themes'

export const metadata = { title: 'Politique de confidentialité — Pontis' }

export default function PrivacyPage() {
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
            <Heading size="7" weight="bold">Politique de confidentialité</Heading>
            <Text size="2" color="gray">Dernière mise à jour : 17 mars 2026</Text>
          </Flex>

          <Section title="1. Données collectées">
            Pontis collecte les données nécessaires au fonctionnement du service : adresse e-mail, mot de passe
            chiffré, jetons d&apos;authentification, et métadonnées liées à vos déploiements (noms de projets,
            logs d&apos;activité, horodatages).
          </Section>

          <Section title="2. Finalité du traitement">
            Les données collectées sont utilisées exclusivement pour fournir et sécuriser le service Pontis :
            authentification, gestion des déploiements, et support technique. Aucune donnée n&apos;est vendue
            ou partagée avec des tiers à des fins commerciales.
          </Section>

          <Section title="3. Stockage et sécurité">
            Les données sont stockées sur l&apos;infrastructure hébergeant votre instance Pontis. L&apos;accès
            est restreint aux administrateurs autorisés. Les mots de passe sont stockés sous forme hachée et
            ne sont jamais lisibles en clair.
          </Section>

          <Section title="4. Cookies et sessions">
            Pontis utilise des cookies de session pour maintenir votre connexion. Ces cookies sont strictement
            nécessaires au fonctionnement du service et ne sont pas utilisés à des fins de suivi ou de
            publicité.
          </Section>

          <Section title="5. Durée de conservation">
            Les données de compte sont conservées aussi longtemps que votre compte est actif. Lors de la
            suppression d&apos;un compte, les données personnelles associées sont supprimées dans un délai
            raisonnable, sauf obligation légale contraire.
          </Section>

          <Section title="6. Vos droits">
            Vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression de vos données
            personnelles. Pour exercer ces droits, contactez l&apos;administrateur de votre instance Pontis.
          </Section>

          <Section title="7. Modifications">
            Cette politique peut être mise à jour pour refléter les évolutions du service. La date de dernière
            modification est indiquée en haut de cette page.
          </Section>

          <Section title="8. Contact">
            Pour toute question relative à cette politique, contactez l&apos;administrateur de votre instance Pontis.
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
