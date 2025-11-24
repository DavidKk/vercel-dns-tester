'use server'

import { serialize } from 'cookie'

import { verify2fa } from '@/services/2fa'
import { AUTH_TOKEN_NAME } from '@/services/auth/constants'
import { generateToken } from '@/utils/jwt'

export async function login(username: string, password: string, token: string) {
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
    // eslint-disable-next-line no-console
    console.warn('Invalid 2FA token')
    throw new Error('Invalid username or password')
  }

  const authToken = generateToken({ authenticated: true })
  const cookie = serialize(AUTH_TOKEN_NAME, authToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60,
    path: '/',
  })

  return { cookie }
}
