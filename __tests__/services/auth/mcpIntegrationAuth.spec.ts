import {
  getAuthenticatedMcpInstallHeaders,
  getClientSafeMcpInstallHeaders,
  hasConfiguredMcpApiKey,
  isSensitiveMcpHeaderName,
  maskSensitiveMcpHeadersForDisplay,
  MCP_SECRET_MASK,
} from '@/services/auth/mcpHeaderPolicy'

describe('isSensitiveMcpHeaderName', () => {
  it('should treat api keys and authorization as sensitive', () => {
    expect(isSensitiveMcpHeaderName('x-api-key')).toBe(true)
    expect(isSensitiveMcpHeaderName('Authorization')).toBe(true)
    expect(isSensitiveMcpHeaderName('X-Custom-Token')).toBe(true)
  })

  it('should allow non-secret custom headers', () => {
    expect(isSensitiveMcpHeaderName('x-trace-id')).toBe(false)
  })
})

describe('getClientSafeMcpInstallHeaders', () => {
  it('should omit sensitive values from client payload', () => {
    const safe = getClientSafeMcpInstallHeaders({
      'x-api-key': 'secret',
      'x-trace-id': 'abc',
    })
    expect(safe).toEqual({ 'x-trace-id': 'abc' })
    expect(hasConfiguredMcpApiKey({ 'x-api-key': 'secret' })).toBe(true)
  })
})

describe('getAuthenticatedMcpInstallHeaders', () => {
  it('should return full configured headers for signed-in install API', () => {
    const configured = { 'x-api-key': 'secret', 'x-trace-id': 'abc' }
    expect(getAuthenticatedMcpInstallHeaders(configured)).toEqual(configured)
  })
})

describe('maskSensitiveMcpHeadersForDisplay', () => {
  it('should mask sensitive header values for on-screen preview', () => {
    expect(
      maskSensitiveMcpHeadersForDisplay({
        'x-api-key': 'secret',
        'x-trace-id': 'abc',
      })
    ).toEqual({ 'x-api-key': MCP_SECRET_MASK, 'x-trace-id': 'abc' })
  })
})
