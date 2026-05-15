import { timingSafeEqual } from 'node:crypto'

import type { NextRequest } from 'next/server'

import { validateCookie } from '@/services/auth/access'

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
 * Compare two strings in constant time to reduce timing leaks on API keys.
 * @param a First secret string
 * @param b Second secret string
 * @returns True when lengths match and bytes are equal
 */
function timingSafeStringEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  if (ba.length !== bb.length) {
    return false
  }
  return timingSafeEqual(ba, bb)
}

/**
 * Authorize MCP HTTP routes (`/api/mcp`): valid session cookie, or `x-api-key` matching `DNS_MCP_HEADERS`
 * (for editor clients after copying install JSON while signed in on `/mcp`). The `/mcp` page uses
 * {@link checkAccess} on the server; `GET /api/mcp/headers` only returns keys when the session cookie is valid.
 * @param req Incoming Next.js request
 * @returns True when the caller may use `/api/mcp`
 */
export async function authorizeDnsMcpIntegration(req: NextRequest): Promise<boolean> {
  if (await validateCookie()) {
    return true
  }

  const configuredHeaders = getConfiguredDnsMcpHeaders()
  const configuredApiKey = Object.entries(configuredHeaders).find(([headerName]) => headerName.toLowerCase() === 'x-api-key')?.[1]
  if (!configuredApiKey) {
    return false
  }

  const headerKey = req.headers.get('x-api-key')?.trim() ?? ''
  if (!headerKey) {
    return false
  }

  return timingSafeStringEqual(headerKey, configuredApiKey)
}
