import type { NextRequest } from 'next/server'

import { api } from '@/initializer/controller'
import { jsonSuccess, jsonUnauthorized } from '@/initializer/response'
import { validateCookie } from '@/services/auth/access'
import { getAuthenticatedMcpInstallHeaders, getConfiguredDnsMcpHeaders } from '@/services/auth/mcpIntegrationAuth'

/** Response body for MCP install UI (authenticated session only) */
export interface DnsMcpHeadersPayload {
  /** Absolute MCP HTTP endpoint for this deployment */
  endpoint: string
  /** Full install headers from `DNS_MCP_HEADERS` (includes `x-api-key` when configured) */
  headers: Record<string, string>
}

/**
 * GET /api/mcp/headers — MCP endpoint URL and install headers for signed-in users.
 * Requires a valid session cookie; returns secret header values for editor install (UI masks by default).
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
      headers: getAuthenticatedMcpInstallHeaders(configured),
    } satisfies DnsMcpHeadersPayload,
    { headers }
  )
})
