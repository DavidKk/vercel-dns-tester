import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/utils/jwt'
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
