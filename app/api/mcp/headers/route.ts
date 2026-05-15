import type { NextRequest } from 'next/server'

import { api } from '@/initializer/controller'
import { jsonSuccess, jsonUnauthorized } from '@/initializer/response'
import { validateCookie } from '@/services/auth/access'
import { getConfiguredDnsMcpHeaders } from '@/services/auth/mcpIntegrationAuth'

/** Response body for MCP install UI (authenticated only) */
export interface DnsMcpHeadersPayload {
  /** Absolute MCP HTTP endpoint for this deployment */
  endpoint: string
  /** Headers to send with MCP requests (from `DNS_MCP_HEADERS`) */
  headers: Record<string, string>
}

/**
 * GET /api/mcp/headers — MCP endpoint URL and auth headers for signed-in users (avoids embedding secrets in public HTML).
 * @param req Incoming request (origin used for endpoint URL)
 * @returns Standard success with {@link DnsMcpHeadersPayload} or 401
 */
export const GET = api(async (req: NextRequest) => {
  if (!(await validateCookie())) {
    return jsonUnauthorized()
  }

  return jsonSuccess({
    endpoint: `${req.nextUrl.origin}/api/mcp`,
    headers: getConfiguredDnsMcpHeaders(),
  } satisfies DnsMcpHeadersPayload)
})
