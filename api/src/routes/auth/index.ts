import { FastifyPluginAsync } from 'fastify'
import bcrypt from 'bcrypt'
import { fetch } from 'undici'
import { randomUUID } from 'node:crypto'
import { RegisterBody, LoginBody } from './schemas'
import { hashToken } from '../../lib/hash'

const REFRESH_COOKIE = 'refresh_token'
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10)
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000

const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: REFRESH_TTL_MS / 1000,
}

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /auth/register
  fastify.post('/register', async (request, reply) => {
    const result = RegisterBody.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({ error: result.error.flatten() })
    }

    const { email, password } = result.data

    const existing = await fastify.prisma.user.findUnique({ where: { email } })
    if (existing) {
      return reply.status(409).send({ error: 'Email already registered' })
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)
    const user = await fastify.prisma.user.create({
      data: { email, passwordHash },
    })

    const familyId = randomUUID()
    const tokens = fastify.generateTokens({ sub: user.id, email: user.email }, familyId)

    await fastify.prisma.refreshToken.create({
      data: {
        userId: user.id,
        familyId,
        tokenHash: hashToken(tokens.refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      },
    })

    reply.setCookie(REFRESH_COOKIE, tokens.refreshToken, cookieOpts)
    return reply.status(201).send({ accessToken: tokens.accessToken, userId: user.id })
  })

  // POST /auth/login
  fastify.post('/login', async (request, reply) => {
    const result = LoginBody.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({ error: result.error.flatten() })
    }

    const { email, password } = result.data

    const user = await fastify.prisma.user.findUnique({ where: { email } })
    if (!user || !user.passwordHash) {
      return reply.status(401).send({ error: 'Invalid credentials' })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials' })
    }

    const familyId = randomUUID()
    const tokens = fastify.generateTokens({ sub: user.id, email: user.email }, familyId)

    await fastify.prisma.refreshToken.create({
      data: {
        userId: user.id,
        familyId,
        tokenHash: hashToken(tokens.refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      },
    })

    reply.setCookie(REFRESH_COOKIE, tokens.refreshToken, cookieOpts)
    return reply.send({ accessToken: tokens.accessToken, userId: user.id })
  })

  // POST /auth/refresh
  fastify.post('/refresh', async (request, reply) => {
    const token = request.cookies?.[REFRESH_COOKIE]
    if (!token) {
      return reply.status(401).send({ error: 'No refresh token' })
    }

    let payload: { sub: string; familyId: string }
    try {
      payload = fastify.verifyRefreshToken(token)
    } catch {
      return reply.status(401).send({ error: 'Invalid or expired refresh token' })
    }

    const stored = await fastify.prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(token) },
    })

    if (!stored) {
      return reply.status(401).send({ error: 'Invalid or expired refresh token' })
    }

    // Reuse detected: token was already revoked — compromise the entire family
    if (stored.revokedAt) {
      await fastify.prisma.refreshToken.updateMany({
        where: { familyId: stored.familyId },
        data: { revokedAt: new Date() },
      })
      reply.clearCookie(REFRESH_COOKIE, { path: '/' })
      return reply.status(401).send({ error: 'Refresh token reuse detected' })
    }

    const user = await fastify.prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user) {
      return reply.status(401).send({ error: 'User not found' })
    }

    // Revoke current token and issue a new one in the same family
    await fastify.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    })

    const tokens = fastify.generateTokens({ sub: user.id, email: user.email }, stored.familyId)

    await fastify.prisma.refreshToken.create({
      data: {
        userId: user.id,
        familyId: stored.familyId,
        tokenHash: hashToken(tokens.refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      },
    })

    reply.setCookie(REFRESH_COOKIE, tokens.refreshToken, cookieOpts)
    return reply.send({ accessToken: tokens.accessToken })
  })

  // GET /auth/logout
  fastify.get('/logout', async (request, reply) => {
    const token = request.cookies?.[REFRESH_COOKIE]
    if (token) {
      try {
        fastify.verifyRefreshToken(token)
        await fastify.prisma.refreshToken.updateMany({
          where: { tokenHash: hashToken(token), revokedAt: null },
          data: { revokedAt: new Date() },
        })
      } catch {
        // Token invalid or expired — still clear the cookie
      }
    }
    reply.clearCookie(REFRESH_COOKIE, { path: '/' })
    return reply.send({ ok: true })
  })

  // GET /auth/gitlab — redirect to GitLab OAuth2
  fastify.get('/gitlab', async (_request, reply) => {
    const gitlabUrl = process.env.GITLAB_URL
    const clientId = process.env.GITLAB_CLIENT_ID
    const callbackUrl = process.env.GITLAB_CALLBACK_URL

    if (!gitlabUrl || !clientId || !callbackUrl) {
      return reply.status(503).send({ error: 'GitLab OAuth2 not configured' })
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: 'read_user',
    })

    return reply.redirect(`${gitlabUrl}/oauth/authorize?${params}`)
  })

  // GET /auth/gitlab/callback
  fastify.get('/gitlab/callback', async (request, reply) => {
    const { code } = request.query as { code?: string }
    if (!code) {
      return reply.status(400).send({ error: 'Missing OAuth2 code' })
    }

    const gitlabUrl = process.env.GITLAB_URL
    const clientId = process.env.GITLAB_CLIENT_ID
    const clientSecret = process.env.GITLAB_CLIENT_SECRET
    const callbackUrl = process.env.GITLAB_CALLBACK_URL

    if (!gitlabUrl || !clientId || !clientSecret || !callbackUrl) {
      return reply.status(503).send({ error: 'GitLab OAuth2 not configured' })
    }

    const tokenRes = await fetch(`${gitlabUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: callbackUrl,
      }),
    })

    if (!tokenRes.ok) {
      return reply.status(502).send({ error: 'Failed to exchange GitLab code' })
    }

    const tokenData = (await tokenRes.json()) as { access_token: string }

    const profileRes = await fetch(`${gitlabUrl}/api/v4/user`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    if (!profileRes.ok) {
      return reply.status(502).send({ error: 'Failed to fetch GitLab user profile' })
    }

    const profile = (await profileRes.json()) as { id: number; email: string }

    const user = await fastify.prisma.user.upsert({
      where: { gitlabId: profile.id },
      update: { gitlabToken: tokenData.access_token, email: profile.email },
      create: {
        email: profile.email,
        gitlabId: profile.id,
        gitlabToken: tokenData.access_token,
      },
    })

    const familyId = randomUUID()
    const tokens = fastify.generateTokens({ sub: user.id, email: user.email }, familyId)

    await fastify.prisma.refreshToken.create({
      data: {
        userId: user.id,
        familyId,
        tokenHash: hashToken(tokens.refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      },
    })

    reply.setCookie(REFRESH_COOKIE, tokens.refreshToken, cookieOpts)
    return reply.send({ accessToken: tokens.accessToken, userId: user.id })
  })
}

export default authRoutes
