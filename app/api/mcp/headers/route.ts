import type { NextRequest } from 'next/server'

import { api } from '@/initializer/controller'
import { jsonSuccess, jsonUnauthorized } from '@/initializer/response'
import { validateCookie } from '@/services/auth/access'
import { getClientSafeMcpInstallHeaders, getConfiguredDnsMcpHeaders, hasConfiguredMcpApiKey } from '@/services/auth/mcpIntegrationAuth'

/** Response body for MCP install UI (authenticated only; secrets are never included) */
export interface DnsMcpHeadersPayload {
  /** Absolute MCP HTTP endpoint for this deployment */
  endpoint: string
  /** Non-sensitive headers safe to embed in install JSON */
  headers: Record<string, string>
  /** True when `x-api-key` is configured server-side but omitted from this response */
  apiKeyConfigured: boolean
}

/**
 * GET /api/mcp/headers — MCP endpoint URL and non-sensitive install headers for signed-in users.
 * Secret values (`x-api-key`, `Authorization`, etc.) are never returned to the browser.
 * @param req Incoming request (origin used for endpoint URL)
 * @returns Standard success with {@link DnsMcpHeadersPayload} or 401
 */
export const GET = api(async (req: NextRequest) => {
  if (!(await validateCookie())) {
    return jsonUnauthorized()
  }

  const configured = getConfiguredDnsMcpHeaders()

  const headers = new Headers()
  headers.set('Cache-Control', 'private, no-store')

  return jsonSuccess(
    {
      endpoint: `${req.nextUrl.origin}/api/mcp`,
      headers: getClientSafeMcpInstallHeaders(configured),
      apiKeyConfigured: hasConfiguredMcpApiKey(configured),
    } satisfies DnsMcpHeadersPayload,
    { headers }
  )
})
