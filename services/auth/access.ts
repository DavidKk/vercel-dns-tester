import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'

import { verifyToken } from '@/utils/jwt'
import { timingSafeStringEqual } from '@/utils/timing-safe'

import { getReqHeaders } from '../context'
import { AUTH_TOKEN_NAME } from './constants'

export interface AuthUser {
  username: string
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const authInfo = cookieStore.get(AUTH_TOKEN_NAME)
  if (!authInfo) {
    return null
  }

  const payload = await verifyToken(authInfo.value)
  if (!payload?.authenticated) {
    return null
  }

  const username = typeof payload.username === 'string' ? payload.username : process.env.ACCESS_USERNAME
  if (!username) {
    return null
  }

  return { username }
}

export interface CheckAccessOptions {
  loginUrl?: string
  redirectUrl?: string
  isApiRouter?: boolean
}

export async function validateCookie() {
  return Boolean(await getAuthUser())
}

export async function checkAccess(options?: CheckAccessOptions) {
  const { redirectUrl = '/', loginUrl = '/login', isApiRouter = true } = options || {}
  if (await validateCookie()) {
    return true
  }

  if (isApiRouter) {
    return false
  }

  const url = redirectUrl ? `${loginUrl}?redirectUrl=${encodeURIComponent(redirectUrl)}` : loginUrl
  redirect(url)
}

export interface CheckUnAccessOptions {
  redirectUrl?: string
  isApiRouter?: boolean
}

export async function checkUnAccess(options?: CheckUnAccessOptions) {
  const { redirectUrl = '/', isApiRouter = true } = options || {}

  if (!(await validateCookie())) {
    return true
  }

  if (isApiRouter) {
    return false
  }

  redirect(redirectUrl)
}

export function checkHeaders(requiredHeaders: Record<string, string>) {
  const headers = getReqHeaders()
  if (!headers) {
    return false
  }

  return Object.entries(requiredHeaders).every(([header, expectedValue]) => {
    const actualValue = headers.get(header)
    return actualValue === expectedValue
  })
}

export function checkApiAccess() {
  const token = process.env.API_SECRET?.trim()
  if (!token) {
    return false
  }

  const headerToken = getReqHeaders()?.get('X-API-TOKEN')?.trim() ?? ''
  if (!headerToken) {
    return false
  }

  return timingSafeStringEqual(headerToken, token)
}

export function checkDoHAccess(req: NextRequest) {
  const apiKey = process.env.DOH_API_KEY?.trim()
  if (!apiKey) {
    return true
  }

  const headerKey = req.headers.get('x-doh-api-key')?.trim() ?? ''
  const url = new URL(req.url)
  const queryKey = url.searchParams.get('token')?.trim() ?? ''

  if (headerKey && timingSafeStringEqual(headerKey, apiKey)) {
    return true
  }

  if (queryKey && timingSafeStringEqual(queryKey, apiKey)) {
    return true
  }

  return false
}
