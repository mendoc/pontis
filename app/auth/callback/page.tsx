'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Flex, Text } from '@radix-ui/themes'
import { useAuth } from '@/app/context/auth'

export default function AuthCallbackPage() {
  const router = useRouter()
  const { accessToken, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      router.push(accessToken ? '/dashboard' : '/login')
    }
  }, [isLoading, accessToken])

  return (
    <Flex align="center" justify="center" style={{ minHeight: '100vh' }}>
      <Text size="2" color="gray">Connexion en cours…</Text>
    </Flex>
  )
}
