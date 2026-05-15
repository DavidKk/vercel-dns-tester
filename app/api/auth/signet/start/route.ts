import { NextResponse } from 'next/server'

import { api } from '@/initializer/controller'
import { buildSignetCallbackUrl, buildSignetLoginUrl, createSignetStateCookie, sanitizeLocalRedirect } from '@/services/auth/signet'
import { isSignetLoginEnabled } from '@/services/auth/signet-sdk'

/**
 * GET /api/auth/signet/start — redirect browser to Signet login
 * @param req Incoming request with optional redirectUrl query
 * @returns Redirect to Signet auth center
 */
export const GET = api(async (req) => {
  if (!isSignetLoginEnabled()) {
    throw new Error('Signet login is disabled')
  }

  const state = crypto.randomUUID()
  const returnTo = sanitizeLocalRedirect(req.nextUrl.searchParams.get('redirectUrl'))
  const signetLoginUrl = await buildSignetLoginUrl({
    redirectUrl: buildSignetCallbackUrl(req),
    state,
  })

  const response = NextResponse.redirect(signetLoginUrl)
  response.headers.append('Set-Cookie', createSignetStateCookie({ state, returnTo }))
  return response
})
