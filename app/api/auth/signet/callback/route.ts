import { NextResponse } from 'next/server'

import { api } from '@/initializer/controller'
import { SIGNET_AUTH_STATE_COOKIE_NAME } from '@/services/auth/constants'
import { clearSignetStateCookie, createSignetAuthCookie, decodeSignetStatePayload, verifySignetCallback } from '@/services/auth/signet'

/**
 * GET /api/auth/signet/callback — verify Signet token and issue local session
 * @param req Callback request from Signet
 * @returns Redirect to app with session cookie
 */
export const GET = api(async (req) => {
  const statePayload = decodeSignetStatePayload(req.cookies.get(SIGNET_AUTH_STATE_COOKIE_NAME)?.value)

  if (!statePayload) {
    const response = NextResponse.redirect(new URL('/login?error=signet_state', req.nextUrl.origin))
    response.headers.append('Set-Cookie', clearSignetStateCookie())
    return response
  }

  try {
    const data = await verifySignetCallback(req.url, statePayload.state)
    const response = NextResponse.redirect(new URL(statePayload.returnTo, req.nextUrl.origin))
    response.headers.append('Set-Cookie', await createSignetAuthCookie(data))
    response.headers.append('Set-Cookie', clearSignetStateCookie())
    return response
  } catch {
    const response = NextResponse.redirect(new URL('/login?error=signet_verify', req.nextUrl.origin))
    response.headers.append('Set-Cookie', clearSignetStateCookie())
    return response
  }
})
