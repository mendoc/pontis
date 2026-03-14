import { describe, it, beforeAll, afterAll } from 'vitest'
import assert from 'node:assert/strict'
import bcrypt from 'bcrypt'
import { buildTestApp } from '../helpers/build'
import { makeMockPrisma } from '../helpers/prisma'
import type { FastifyInstance } from 'fastify'

const mockUserBase = {
  id: 'user-uuid-1',
  email: 'test@example.com',
  gitlabId: null,
  gitlabToken: null,
  createdAt: new Date(),
}

// ------------------------------------------------------------------ register
describe('POST /auth/register', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await buildTestApp({
      prisma: makeMockPrisma({
        findUnique: async () => null,
        create: async (args: any) => ({
          id: 'user-uuid-1',
          email: args.data.email,
          passwordHash: args.data.passwordHash,
          gitlabId: null,
          gitlabToken: null,
          createdAt: new Date(),
        }),
      }),
    })
  })

  afterAll(async () => {
    await app.close()
  })

  it('success → 201, body has accessToken and userId, sets refresh_token cookie', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'new@example.com', password: 'password123' },
    })
    assert.equal(response.statusCode, 201)
    const body = response.json<{ accessToken: string; userId: string }>()
    assert.ok(typeof body.accessToken === 'string' && body.accessToken.length > 0)
    assert.ok(typeof body.userId === 'string' && body.userId.length > 0)
    const cookies = response.headers['set-cookie']
    assert.ok(cookies, 'set-cookie header should be present')
    const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : cookies
    assert.ok(cookieStr.includes('refresh_token='))
  })

  it('invalid email → 400', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'not-an-email', password: 'password123' },
    })
    assert.equal(response.statusCode, 400)
  })

  it('password too short (< 8 chars) → 400', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'short@example.com', password: 'abc' },
    })
    assert.equal(response.statusCode, 400)
  })
})

describe('POST /auth/register - duplicate email', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await buildTestApp({
      prisma: makeMockPrisma({
        findUnique: async () => ({ ...mockUserBase, passwordHash: 'hash' }),
      }),
    })
  })

  afterAll(async () => {
    await app.close()
  })

  it('duplicate email → 409', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'test@example.com', password: 'password123' },
    })
    assert.equal(response.statusCode, 409)
    const body = response.json<{ error: string }>()
    assert.equal(body.error, 'Email already registered')
  })
})

// ------------------------------------------------------------------ login
describe('POST /auth/login', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('password123', 1)
    app = await buildTestApp({
      prisma: makeMockPrisma({
        findUnique: async () => ({ ...mockUserBase, passwordHash }),
      }),
    })
  })

  afterAll(async () => {
    await app.close()
  })

  it('success → 200, body has accessToken and userId, sets cookie', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'test@example.com', password: 'password123' },
    })
    assert.equal(response.statusCode, 200)
    const body = response.json<{ accessToken: string; userId: string }>()
    assert.ok(typeof body.accessToken === 'string' && body.accessToken.length > 0)
    assert.ok(typeof body.userId === 'string' && body.userId.length > 0)
    const cookies = response.headers['set-cookie']
    assert.ok(cookies, 'set-cookie header should be present')
    const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : cookies
    assert.ok(cookieStr.includes('refresh_token='))
  })

  it('wrong password → 401 { error: "Invalid credentials" }', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'test@example.com', password: 'wrongpassword' },
    })
    assert.equal(response.statusCode, 401)
    const body = response.json<{ error: string }>()
    assert.equal(body.error, 'Invalid credentials')
  })
})

describe('POST /auth/login - unknown email', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await buildTestApp({
      prisma: makeMockPrisma({ findUnique: async () => null }),
    })
  })

  afterAll(async () => {
    await app.close()
  })

  it('unknown email → 401', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'nobody@example.com', password: 'password123' },
    })
    assert.equal(response.statusCode, 401)
  })
})

// ------------------------------------------------------------------ refresh
describe('POST /auth/refresh', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await buildTestApp({
      prisma: makeMockPrisma({
        findUnique: async () => ({ ...mockUserBase, passwordHash: null }),
      }),
    })
  })

  afterAll(async () => {
    await app.close()
  })

  it('valid cookie → 200, body has accessToken', async () => {
    const { refreshToken } = app.generateTokens({ sub: mockUserBase.id, email: mockUserBase.email })
    const response = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      headers: { cookie: `refresh_token=${refreshToken}` },
    })
    assert.equal(response.statusCode, 200)
    const body = response.json<{ accessToken: string }>()
    assert.ok(typeof body.accessToken === 'string' && body.accessToken.length > 0)
  })

  it('no cookie → 401 { error: "No refresh token" }', async () => {
    const response = await app.inject({ method: 'POST', url: '/auth/refresh' })
    assert.equal(response.statusCode, 401)
    const body = response.json<{ error: string }>()
    assert.equal(body.error, 'No refresh token')
  })

  it('invalid cookie value → 401', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      headers: { cookie: 'refresh_token=thisisnotavalidtoken' },
    })
    assert.equal(response.statusCode, 401)
  })
})

// ------------------------------------------------------------------ logout
describe('GET /auth/logout', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await buildTestApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it('→ 200 { ok: true }, clears refresh_token cookie', async () => {
    const response = await app.inject({ method: 'GET', url: '/auth/logout' })
    assert.equal(response.statusCode, 200)
    const body = response.json<{ ok: boolean }>()
    assert.equal(body.ok, true)
    const cookies = response.headers['set-cookie']
    assert.ok(cookies, 'set-cookie header should be present')
    const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : cookies
    assert.ok(
      cookieStr.includes('refresh_token=') || cookieStr.toLowerCase().includes('max-age=0') || cookieStr.toLowerCase().includes('expires='),
      'cookie should be cleared'
    )
  })
})

// ------------------------------------------------------------------ gitlab
describe('GET /auth/gitlab', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    delete process.env.GITLAB_URL
    delete process.env.GITLAB_CLIENT_ID
    delete process.env.GITLAB_CALLBACK_URL
    app = await buildTestApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it('without env vars → 503', async () => {
    const response = await app.inject({ method: 'GET', url: '/auth/gitlab' })
    assert.equal(response.statusCode, 503)
  })
})
