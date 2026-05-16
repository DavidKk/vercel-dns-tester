import type { NextRequest } from 'next/server'

import { validateCookie } from '@/services/auth/access'
import { timingSafeStringEqual } from '@/utils/timing-safe'

export { getClientSafeMcpInstallHeaders, hasConfiguredMcpApiKey, isSensitiveMcpHeaderName } from './mcpHeaderPolicy'

/**
 * Parse MCP auth headers from env `DNS_MCP_HEADERS` (JSON object of header name → value).
 * @returns Normalized header map, or an empty object when unset or invalid
 */
export function getConfiguredDnsMcpHeaders(): Record<string, string> {
  const rawHeaders = process.env.DNS_MCP_HEADERS?.trim()
  if (!rawHeaders) {
    return {}
  }
  try {
    const parsed = JSON.parse(rawHeaders) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {}
    }
    return Object.entries(parsed).reduce<Record<string, string>>((acc, [key, value]) => {
      if (typeof value === 'string') {
        const headerKey = key.trim()
        const headerValue = value.trim()
        if (headerKey && headerValue) {
          acc[headerKey] = headerValue
        }
      }
      return acc
    }, {})
  } catch {
    return {}
  }
}

/**
 * Compare every configured MCP header on the incoming request (constant-time per value).
 * @param req Incoming Next.js request
 * @param configured Expected headers from env
 * @returns True when all configured headers match
 */
function requestMatchesConfiguredMcpHeaders(req: NextRequest, configured: Record<string, string>): boolean {
  const entries = Object.entries(configured)
  if (entries.length === 0) {
    return false
  }

  return entries.every(([name, expected]) => {
    const actual = req.headers.get(name)?.trim() ?? ''
    if (!actual) {
      return false
    }
    return timingSafeStringEqual(actual, expected)
  })
}

/**
 * Authorize MCP HTTP routes (`/api/mcp`): valid session cookie, or all headers in `DNS_MCP_HEADERS` on the request.
 * The `/mcp` page is public; `GET /api/mcp/headers` never returns secret header values.
 * @param req Incoming Next.js request
 * @returns True when the caller may use `/api/mcp`
 */
export async function authorizeDnsMcpIntegration(req: NextRequest): Promise<boolean> {
  if (await validateCookie()) {
    return true
  }

  const configuredHeaders = getConfiguredDnsMcpHeaders()
  return requestMatchesConfiguredMcpHeaders(req, configuredHeaders)
}
