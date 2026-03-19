'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Box, Flex, Heading, Text, TextField, Button, Separator, Callout } from '@radix-ui/themes'
import { EyeOpenIcon, EyeClosedIcon } from '@radix-ui/react-icons'
import { useAuth } from '@/app/context/auth'

function GitLabIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 380 380" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M189.999 340.6l54.45-167.56H135.55L189.999 340.6z" fill="#E24329" />
      <path d="M189.999 340.6L135.55 173.04H52.42L189.999 340.6z" fill="#FC6D26" />
      <path d="M52.42 173.04L35.13 225.9a11.64 11.64 0 004.23 13.01L189.999 340.6 52.42 173.04z" fill="#FCA326" />
      <path d="M52.42 173.04h83.13L101.46 63.1c-1.87-5.76-9.99-5.76-11.86 0L52.42 173.04z" fill="#E24329" />
      <path d="M189.999 340.6l54.45-167.56h83.13L189.999 340.6z" fill="#FC6D26" />
      <path d="M327.58 173.04l17.29 52.86a11.64 11.64 0 01-4.23 13.01L189.999 340.6l137.58-167.56z" fill="#FCA326" />
      <path d="M327.58 173.04h-83.13l34.1-109.94c1.87-5.76 9.99-5.76 11.86 0l37.17 109.94z" fill="#E24329" />
    </svg>
  )
}

function SearchParamsError({ onError }: { onError: (msg: string) => void }) {
  const searchParams = useSearchParams()
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam === 'gitlab_denied') {
      onError('Connexion GitLab annulée.')
    } else if (errorParam) {
      onError('Une erreur est survenue lors de la connexion.')
    }
  }, [searchParams, onError])
  return null
}

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      await login(email, password)
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
      className="login-wrapper"
      style={{ minHeight: '100vh', backgroundColor: 'var(--color-background)', boxSizing: 'border-box' }}
    >
      <Box
        className="login-box"
        style={{
          border: '1px solid var(--gray-6)',
          backgroundColor: 'var(--color-panel-solid)',
        }}
      >
        <Flex direction="column" gap="6">
          {/* En-tête */}
          <Flex direction="column" gap="1">
            <Heading size="7" weight="bold">Pontis</Heading>
            <Text size="3" color="gray">Connectez-vous à votre compte</Text>
          </Flex>

          {/* Bouton GitLab */}
          <Button
            size="3"
            variant="outline"
            color="gray"
            style={{ width: '100%', cursor: 'pointer', gap: 10 }}
            asChild
          >
            <a href="/api/v1/auth/gitlab">
              <GitLabIcon />
              Continuer avec GitLab
            </a>
          </Button>

          {/* Séparateur */}
          <Flex align="center" gap="3">
            <Separator style={{ flex: 1 }} />
            <Text size="1" color="gray">ou</Text>
            <Separator style={{ flex: 1 }} />
          </Flex>

          {/* Erreur depuis les paramètres URL (ex: SSO annulé) */}
          <Suspense>
            <SearchParamsError onError={setError} />
          </Suspense>

          {/* Message d'erreur */}
          {error && (
            <Callout.Root color="red" size="1">
              <Callout.Text>{error}</Callout.Text>
            </Callout.Root>
          )}

          {/* Formulaire email/mot de passe */}
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
                  size="3"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Flex>

              <Flex direction="column" gap="1">
                <Flex justify="between" align="center">
                  <Text as="label" size="2" weight="medium" htmlFor="password">
                    Mot de passe
                  </Text>
                  <Link href="/forgot-password" style={{ fontSize: 13, color: 'var(--gray-10)' }}>
                    Oublié ?
                  </Link>
                </Flex>
                <TextField.Root
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  size="3"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                >
                  <TextField.Slot side="right">
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        color: 'var(--gray-9)',
                      }}
                      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                    </button>
                  </TextField.Slot>
                </TextField.Root>
              </Flex>

              <Button
                type="submit"
                size="3"
                variant="solid"
                color="gray"
                highContrast
                style={{ width: '100%', cursor: 'pointer' }}
                disabled={isLoading}
              >
                {isLoading ? 'Connexion…' : 'Se connecter'}
              </Button>
            </form>
          </Flex>

          {/* Lien inscription */}
          <Text size="2" color="gray" align="center">
            Pas encore de compte ?{' '}
            <Link href="/register" style={{ color: 'var(--gray-12)', fontWeight: 500 }}>
              S&apos;inscrire
            </Link>
          </Text>
        </Flex>
      </Box>

      {/* Notice CGU */}
      <Box className="login-cgu">
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
