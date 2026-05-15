import { serialize } from 'cookie'
import type { NextRequest } from 'next/server'

import { generateToken, jwtExpiresInToMaxAgeSeconds } from '@/utils/jwt'

import { AUTH_TOKEN_NAME, SIGNET_AUTH_STATE_COOKIE_NAME } from './constants'
import { getSignetAudience, getSignetOrigin, loadSignetSdk, type SignetVerifyData } from './signet-sdk'

const SIGNET_STATE_MAX_AGE_SECONDS = 10 * 60
const SIGNET_AUTH_MAX_AGE = '7d'

export interface SignetStatePayload {
  state: string
  returnTo: string
}

/**
 * Build a local callback URL for the Signet auth center
 * @param req Current request
 * @returns Absolute callback URL
 */
export function buildSignetCallbackUrl(req: NextRequest): string {
  return new URL('/api/auth/signet/callback', req.nextUrl.origin).toString()
}

/**
 * Keep post-login redirects inside this app
 * @param value Raw redirect target
 * @returns Safe local redirect path
 */
export function sanitizeLocalRedirect(value: string | null | undefined): string {
  if (!value) {
    return '/'
  }

  try {
    const decoded = decodeURIComponent(value)
    if (!decoded.startsWith('/') || decoded.startsWith('//')) {
      return '/'
    }
    return decoded
  } catch {
    return '/'
  }
}

/**
 * Encode the OAuth state cookie payload
 * @param payload State payload
 * @returns Base64url JSON
 */
export function encodeSignetStatePayload(payload: SignetStatePayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
}

/**
 * Decode the OAuth state cookie payload
 * @param value Cookie value
 * @returns Parsed state payload, or null if invalid
 */
export function decodeSignetStatePayload(value: string | undefined): SignetStatePayload | null {
  if (!value) {
    return null
  }

  try {
    const payload = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as Partial<SignetStatePayload>
    if (typeof payload.state !== 'string' || typeof payload.returnTo !== 'string') {
      return null
    }
    return { state: payload.state, returnTo: sanitizeLocalRedirect(payload.returnTo) }
  } catch {
    return null
  }
}

/**
 * Create the temporary state cookie used to protect the Signet callback
 * @param payload State payload
 * @returns Set-Cookie header value
 */
export function createSignetStateCookie(payload: SignetStatePayload): string {
  return serialize(SIGNET_AUTH_STATE_COOKIE_NAME, encodeSignetStatePayload(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: SIGNET_STATE_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax',
  })
}

/**
 * Clear the temporary Signet state cookie
 * @returns Set-Cookie header value
 */
export function clearSignetStateCookie(): string {
  return serialize(SIGNET_AUTH_STATE_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    path: '/',
    sameSite: 'lax',
  })
}

/**
 * Build the Signet login URL with the hosted SDK
 * @param params Redirect params
 * @returns Absolute Signet login URL
 */
export async function buildSignetLoginUrl(params: { redirectUrl: string; state: string }): Promise<string> {
  const signet = await loadSignetSdk()
  return signet.buildLoginUrl({
    authCenterOrigin: getSignetOrigin(),
    redirectUrl: params.redirectUrl,
    state: params.state,
  })
}

/**
 * Parse and verify the Signet callback with the hosted SDK
 * @param callbackUrl Full callback URL
 * @param expectedState Expected CSRF state
 * @returns Verified Signet data
 */
export async function verifySignetCallback(callbackUrl: string, expectedState: string): Promise<SignetVerifyData> {
  const signet = await loadSignetSdk()
  const { token, state } = signet.parseLoginCallbackParams(callbackUrl)
  if (!token || state !== expectedState) {
    throw new Error('Invalid Signet callback state')
  }

  const result = await signet.verifyTokenAtAuthCenter({
    authCenterOrigin: getSignetOrigin(),
    token,
    audience: getSignetAudience(),
  })

  if (!result.ok || !result.response?.data) {
    throw new Error(result.error || result.response?.message || 'Signet token verification failed')
  }

  return result.response.data
}

/**
 * Resolve a display username from verified Signet identity
 * @param data Verified Signet payload
 * @returns Username for JWT claims
 */
function resolveSignetUsername(data: SignetVerifyData): string {
  const user = data.user
  return user?.preferred_username || user?.username || user?.email || user?.sub || 'signet-user'
}

/**
 * Create this app's auth cookie from verified Signet identity
 * @param data Verified Signet data
 * @returns Set-Cookie header value
 */
export async function createSignetAuthCookie(data: SignetVerifyData): Promise<string> {
  const username = resolveSignetUsername(data)
  const authToken = await generateToken(
    {
      authenticated: true,
      username,
      provider: 'signet',
      signetSub: data.user?.sub,
      signetEmail: data.user?.email,
    },
    SIGNET_AUTH_MAX_AGE
  )

  return serialize(AUTH_TOKEN_NAME, authToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: jwtExpiresInToMaxAgeSeconds(SIGNET_AUTH_MAX_AGE),
    path: '/',
    sameSite: 'lax',
  })
}
