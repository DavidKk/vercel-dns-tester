'use server'

import { serialize } from 'cookie'

import { verify2fa } from '@/services/2fa'
import { AUTH_TOKEN_NAME } from '@/services/auth/constants'
import { generateToken, getLoginJwtExpiresIn, jwtExpiresInToMaxAgeSeconds } from '@/utils/jwt'

/**
 * Authenticate with username/password and optional 2FA, returning a session cookie
 * @param username Admin username
 * @param password Admin password
 * @param token Optional TOTP token
 * @param rememberMe When true, use JWT_EXPIRES_IN; otherwise one day
 * @returns Set-Cookie header value for auth_token
 */
export async function login(username: string, password: string, token: string, rememberMe = true) {
  if (!username) {
    throw new Error('Username is required')
  }

  if (!password) {
    throw new Error('Password is required')
  }

  if (process.env.ACCESS_USERNAME !== username || process.env.ACCESS_PASSWORD !== password) {
    throw new Error('Invalid username or password')
  }

  const secret = process.env.ACCESS_2FA_SECRET
  if (secret && !(token && (await verify2fa({ token, secret })))) {
    throw new Error('Invalid username or password')
  }

  const expiresIn = getLoginJwtExpiresIn(rememberMe)
  const authToken = await generateToken({ authenticated: true, username, provider: 'local' }, expiresIn)
  const cookie = serialize(AUTH_TOKEN_NAME, authToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: jwtExpiresInToMaxAgeSeconds(expiresIn),
    path: '/',
    sameSite: 'lax',
  })

  return { cookie }
}
