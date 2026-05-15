import { serialize } from 'cookie'

import { login } from '@/app/actions/auth'
import { api } from '@/initializer/controller'
import { jsonSuccess } from '@/initializer/response'
import { getAuthUser } from '@/services/auth/access'
import { AUTH_TOKEN_NAME } from '@/services/auth/constants'

export const GET = api(async () => {
  const user = await getAuthUser()
  return jsonSuccess({ user })
})

export const POST = api(async (req) => {
  const body = (await req.json()) as { username?: string; password?: string; token?: string; rememberMe?: boolean }
  const { username = '', password = '', token = '' } = body
  const rememberMe = body.rememberMe !== false
  const { cookie } = await login(username, password, token, rememberMe)

  const headers = new Headers()
  headers.append('Set-Cookie', cookie)

  return jsonSuccess(null, { headers })
})

export const DELETE = api(async () => {
  const headers = new Headers()
  headers.append(
    'Set-Cookie',
    serialize(AUTH_TOKEN_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0,
      path: '/',
    })
  )

  return jsonSuccess(null, { headers })
})
