/**
 * Whether an MCP header name carries a secret and must not be returned to browsers.
 * @param headerName HTTP header name
 * @returns True when the value must not appear in `/api/mcp/headers` responses
 */
export function isSensitiveMcpHeaderName(headerName: string): boolean {
  const lower = headerName.trim().toLowerCase()
  if (lower === 'x-api-key' || lower === 'authorization' || lower === 'cookie') {
    return true
  }
  return lower.includes('token') || lower.includes('secret') || lower.includes('password')
}

/**
 * Non-secret headers safe to expose on the signed-in install page (never includes API keys).
 * @param configured Full header map from env
 * @returns Headers that may be embedded in client install JSON
 */
export function getClientSafeMcpInstallHeaders(configured: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(configured).filter(([name]) => !isSensitiveMcpHeaderName(name)))
}

/**
 * Full MCP install headers for an authenticated session (`GET /api/mcp/headers`).
 * @param configured Full header map from env
 * @returns Copy of all configured headers for editor `mcp.json` (includes `x-api-key`)
 */
export function getAuthenticatedMcpInstallHeaders(configured: Record<string, string>): Record<string, string> {
  return { ...configured }
}

/** Mask shown in the install UI when secrets are hidden */
export const MCP_SECRET_MASK = '********'

/**
 * Header map with sensitive values replaced for on-screen preview (copy/install still use plaintext).
 * @param headers Full install headers
 * @returns Copy with sensitive values masked
 */
export function maskSensitiveMcpHeadersForDisplay(headers: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(headers).map(([name, value]) => [name, isSensitiveMcpHeaderName(name) ? MCP_SECRET_MASK : value]))
}

/**
 * Whether `DNS_MCP_HEADERS` configures an API key used for editor MCP clients.
 * @param configured Full header map from env
 * @returns True when `x-api-key` is configured
 */
export function hasConfiguredMcpApiKey(configured: Record<string, string>): boolean {
  return Object.entries(configured).some(([name, value]) => name.toLowerCase() === 'x-api-key' && value.trim().length > 0)
}
