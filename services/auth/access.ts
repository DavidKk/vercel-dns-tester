import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'

import { verifyToken } from '@/utils/jwt'

import { getReqHeaders } from '../context'
import { AUTH_TOKEN_NAME } from './constants'

export interface CheckAccessOptions {
  loginUrl?: string
  redirectUrl?: string
  isApiRouter?: boolean
}

export async function validateCookie() {
  const cookieStore = await cookies()
  const authInfo = cookieStore.get(AUTH_TOKEN_NAME)
  if (!authInfo) {
    return false
  }

  const token = authInfo.value
  const user = token ? verifyToken(token) : null
  if (!user) {
    return false
  }

  return true
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
  const token = process.env.API_SECRET
  return checkHeaders({ 'X-API-TOKEN': token })
}

export function checkDoHAccess(req: NextRequest) {
  const apiKey = process.env.DOH_API_KEY
  if (!apiKey) {
    return true
  }

  const headerKey = req.headers.get('x-doh-api-key')
  const url = new URL(req.url)
  const queryKey = url.searchParams.get('token')

  return headerKey === apiKey || queryKey === apiKey
}
