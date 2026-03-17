'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Box, Flex, Heading, Text, TextField, Button, Callout } from '@radix-ui/themes'
import { EyeOpenIcon, EyeClosedIcon } from '@radix-ui/react-icons'
import { useAuth } from '@/app/context/auth'

type Step = 'email' | 'code' | 'password'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { resetPassword } = useAuth()

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current) }
  }, [])

  const startCooldown = () => {
    setResendCooldown(60)
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'Aucun compte associé à cette adresse e-mail') {
          setError('Aucun compte associé à cette adresse e-mail.')
        } else if (data.error === 'SSO account cannot reset password') {
          setError('Ce compte utilise GitLab pour se connecter. La réinitialisation par email n\'est pas disponible.')
        } else {
          setError(data.error ?? 'Une erreur est survenue')
        }
        return
      }
      setStep('code')
      startCooldown()
    } finally {
      setIsLoading(false)
    }
  }

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      const res = await fetch('/api/v1/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error === 'Code expiré' ? 'Ce code a expiré. Recommencez.' : 'Code incorrect.')
        return
      }
      setStep('password')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
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
      await resetPassword(email, code, password)
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
            <Text size="2" color="gray">
              {step === 'email' && 'Réinitialisation du mot de passe'}
              {step === 'code' && 'Vérification du code'}
              {step === 'password' && 'Nouveau mot de passe'}
            </Text>
          </Flex>

          {error && (
            <Callout.Root color="red" size="1">
              <Callout.Text>{error}</Callout.Text>
            </Callout.Root>
          )}

          {/* Étape 1 : email */}
          {step === 'email' && (
            <Flex asChild direction="column" gap="4">
              <form onSubmit={handleEmailSubmit}>
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
                  <Text size="1" color="gray">
                    Un code de vérification à 6 chiffres vous sera envoyé.
                  </Text>
                </Flex>
                <Button type="submit" size="2" variant="solid" color="gray" highContrast
                  style={{ width: '100%', cursor: 'pointer' }} disabled={isLoading}>
                  {isLoading ? 'Envoi…' : 'Envoyer le code'}
                </Button>
              </form>
            </Flex>
          )}

          {/* Étape 2 : code */}
          {step === 'code' && (
            <Flex asChild direction="column" gap="4">
              <form onSubmit={handleCodeSubmit}>
                <Flex direction="column" gap="1">
                  <Text as="label" size="2" weight="medium" htmlFor="code">
                    Code de vérification
                  </Text>
                  <TextField.Root
                    id="code"
                    type="text"
                    inputMode="numeric"
                    placeholder="123456"
                    maxLength={6}
                    size="2"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                  <Text size="1" color="gray">
                    Code envoyé à <strong>{email}</strong>. Valable 15 minutes.
                  </Text>
                </Flex>
                <Button type="submit" size="2" variant="solid" color="gray" highContrast
                  style={{ width: '100%', cursor: 'pointer' }} disabled={isLoading || code.length !== 6}>
                  {isLoading ? 'Vérification…' : 'Vérifier le code'}
                </Button>
                <Button type="button" variant="outline" color="gray" size="2"
                  style={{ width: '100%', cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer' }}
                  disabled={resendCooldown > 0}
                  onClick={() => { setStep('email'); setCode(''); setError(null) }}>
                  {resendCooldown > 0 ? `Renvoyer un code (${resendCooldown}s)` : 'Renvoyer un code'}
                </Button>
              </form>
            </Flex>
          )}

          {/* Étape 3 : nouveau mot de passe */}
          {step === 'password' && (
            <Flex asChild direction="column" gap="4">
              <form onSubmit={handlePasswordSubmit}>
                <Flex direction="column" gap="1">
                  <Text as="label" size="2" weight="medium" htmlFor="password">
                    Nouveau mot de passe
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
                      <button type="button" onClick={() => setShowPassword((v) => !v)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: 'var(--gray-9)' }}
                        aria-label={showPassword ? 'Masquer' : 'Afficher'}>
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
                      <button type="button" onClick={() => setShowConfirm((v) => !v)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: 'var(--gray-9)' }}
                        aria-label={showConfirm ? 'Masquer' : 'Afficher'}>
                        {showConfirm ? <EyeClosedIcon /> : <EyeOpenIcon />}
                      </button>
                    </TextField.Slot>
                  </TextField.Root>
                </Flex>
                <Button type="submit" size="2" variant="solid" color="gray" highContrast
                  style={{ width: '100%', cursor: 'pointer' }} disabled={isLoading}>
                  {isLoading ? 'Enregistrement…' : 'Réinitialiser le mot de passe'}
                </Button>
              </form>
            </Flex>
          )}

          <Text size="2" color="gray" align="center">
            <Link href="/login" style={{ color: 'var(--gray-12)', fontWeight: 500 }}>
              Retour à la connexion
            </Link>
          </Text>
        </Flex>
      </Box>
    </Flex>
  )
}
