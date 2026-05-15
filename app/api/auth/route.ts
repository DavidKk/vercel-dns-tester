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
  const { username, password, token } = await req.json()
  const { cookie } = await login(username, password, token)

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
