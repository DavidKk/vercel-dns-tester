/**
 * @jest-environment node
 */

// Mock the fetchDNSQuery function to avoid actual network calls
jest.mock('@/services/dns/fetch-dns-query', () => ({
  fetchDNSQuery: jest.fn(),
}))

describe('DNS Test MCP Tools', () => {
  // Import the modules after mocking
  let queryDNS: any
  let batchQueryDNS: any

  beforeAll(async () => {
    // Dynamic import to ensure mocks are applied
    const module = await import('@/app/mcp/dns-test/queryDNS')
    queryDNS = module.default

    const batchModule = await import('@/app/mcp/dns-test/batchQueryDNS')
    batchQueryDNS = batchModule.default
  })

  describe('queryDNS tool', () => {
    it('should have correct name and description', () => {
      expect(queryDNS.name).toBe('query_dns')
      expect(queryDNS.description).toBe('Query DNS records for a domain using a specified DNS server')
    })

    it('should have correct parameter schema', () => {
      const manifest = queryDNS.manifest
      expect(manifest.parameters).toBeDefined()
      expect(manifest.parameters.type).toBe('object')
      expect(manifest.parameters.properties).toHaveProperty('dnsServer')
      expect(manifest.parameters.properties).toHaveProperty('domain')
      expect(manifest.parameters.properties).toHaveProperty('queryType')
    })
  })

  describe('batchQueryDNS tool', () => {
    it('should have correct name and description', () => {
      expect(batchQueryDNS.name).toBe('batch_query_dns')
      expect(batchQueryDNS.description).toBe('Query DNS records for multiple domains using specified DNS servers')
    })

    it('should have correct parameter schema', () => {
      const manifest = batchQueryDNS.manifest
      expect(manifest.parameters).toBeDefined()
      expect(manifest.parameters.type).toBe('object')
      expect(manifest.parameters.properties).toHaveProperty('dnsServers')
      expect(manifest.parameters.properties).toHaveProperty('domains')
      expect(manifest.parameters.properties).toHaveProperty('queryType')
    })
  })
})
