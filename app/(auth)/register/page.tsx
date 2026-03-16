'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Box, Flex, Heading, Text, TextField, Button, Callout } from '@radix-ui/themes'
import { EyeOpenIcon, EyeClosedIcon } from '@radix-ui/react-icons'
import { useAuth } from '@/app/context/auth'

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    setIsLoading(true)
    try {
      await register(email, password)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Flex
      align="center"
      justify="center"
      direction="column"
      style={{ minHeight: '100vh', backgroundColor: 'var(--color-background)' }}
    >
      <Box
        style={{
          width: 400,
          border: '1px solid var(--gray-6)',
          padding: 40,
          backgroundColor: 'var(--color-panel-solid)',
        }}
      >
        <Flex direction="column" gap="6">
          <Flex direction="column" gap="1">
            <Heading size="6" weight="bold">Pontis</Heading>
            <Text size="2" color="gray">Créez votre compte</Text>
          </Flex>

          {error && (
            <Callout.Root color="red" size="1">
              <Callout.Text>{error}</Callout.Text>
            </Callout.Root>
          )}

          <Flex asChild direction="column" gap="4">
            <form onSubmit={handleSubmit}>
              <Flex direction="column" gap="1">
                <Text as="label" size="2" weight="medium" htmlFor="email">
                  Adresse e-mail
                </Text>
                <TextField.Root
                  id="email"
                  type="email"
                  placeholder="vous@exemple.com"
                  autoComplete="email"
                  size="2"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Flex>

              <Flex direction="column" gap="1">
                <Text as="label" size="2" weight="medium" htmlFor="password">
                  Mot de passe
                </Text>
                <TextField.Root
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="8 caractères minimum"
                  autoComplete="new-password"
                  size="2"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                >
                  <TextField.Slot side="right">
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: 'var(--gray-9)' }}
                      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                    </button>
                  </TextField.Slot>
                </TextField.Root>
              </Flex>

              <Flex direction="column" gap="1">
                <Text as="label" size="2" weight="medium" htmlFor="confirm">
                  Confirmer le mot de passe
                </Text>
                <TextField.Root
                  id="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  size="2"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                >
                  <TextField.Slot side="right">
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: 'var(--gray-9)' }}
                      aria-label={showConfirm ? 'Masquer la confirmation' : 'Afficher la confirmation'}
                    >
                      {showConfirm ? <EyeClosedIcon /> : <EyeOpenIcon />}
                    </button>
                  </TextField.Slot>
                </TextField.Root>
              </Flex>

              <Button
                type="submit"
                size="2"
                variant="solid"
                color="gray"
                highContrast
                style={{ width: '100%', cursor: 'pointer' }}
                disabled={isLoading}
              >
                {isLoading ? 'Création…' : 'Créer un compte'}
              </Button>
            </form>
          </Flex>

          <Text size="2" color="gray" align="center">
            Déjà un compte ?{' '}
            <Link href="/login" style={{ color: 'var(--gray-12)', fontWeight: 500 }}>
              Se connecter
            </Link>
          </Text>
        </Flex>
      </Box>

      <Box style={{ width: 400, padding: '20px 40px 0' }}>
        <Text size="1" color="gray" align="center" as="p" style={{ lineHeight: 1.6 }}>
          En continuant, vous acceptez les{' '}
          <Link href="/legal/terms" style={{ color: 'var(--gray-11)', textDecoration: 'underline' }}>
            Conditions d&apos;utilisation
          </Link>{' '}
          et la{' '}
          <Link href="/legal/privacy" style={{ color: 'var(--gray-11)', textDecoration: 'underline' }}>
            Politique de confidentialité
          </Link>{' '}
          de Pontis.
        </Text>
      </Box>
    </Flex>
  )
}
