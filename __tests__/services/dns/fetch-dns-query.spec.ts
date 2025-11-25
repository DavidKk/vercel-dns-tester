import { convertToDNSMessage } from '@/services/dns/dns-message'
import { checkOptionsSupport, fetchDNSQuery } from '@/services/dns/fetch-dns-query'
import type { DNSRecord } from '@/services/dns/types'

// Mock fetch globally
global.fetch = jest.fn()

// Helper function to create a valid DNS response buffer
function createMockDNSResponse(records: DNSRecord[]): ArrayBuffer {
  return convertToDNSMessage(records)
}

describe('fetch-dns-query', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('checkOptionsSupport', () => {
    it('should return true when OPTIONS returns 204', async () => {
      const mockResponse = {
        status: 204,
      }

      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      const result = await checkOptionsSupport('dns.google')

      expect(result).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith('https://dns.google/dns-query', {
        method: 'OPTIONS',
        headers: {
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type',
        },
      })
    })

    it('should return true when OPTIONS returns 200', async () => {
      const mockResponse = {
        status: 200,
      }

      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      const result = await checkOptionsSupport('dns.google')

      expect(result).toBe(true)
    })

    it('should return true when OPTIONS returns 405', async () => {
      const mockResponse = {
        status: 405,
      }

      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      const result = await checkOptionsSupport('dns.google')

      expect(result).toBe(true)
    })

    it('should return false when OPTIONS fails', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      const result = await checkOptionsSupport('dns.google')

      expect(result).toBe(false)
    })

    it('should include custom headers in Access-Control-Request-Headers', async () => {
      const mockResponse = {
        status: 204,
      }

      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      await checkOptionsSupport('dns.google', { 'X-Custom-Header': 'value' })

      expect(global.fetch).toHaveBeenCalledWith('https://dns.google/dns-query', {
        method: 'OPTIONS',
        headers: {
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type, x-custom-header',
        },
      })
    })
  })

  describe('fetchDNSQuery', () => {
    it('should throw error if dns is missing', async () => {
      await expect(fetchDNSQuery('', 'example.com', 'A')).rejects.toThrow('DNS and domain are required')
    })

    it('should throw error if domain is missing', async () => {
      await expect(fetchDNSQuery('1.1.1.1', '', 'A')).rejects.toThrow('DNS and domain are required')
    })

    it('should make correct POST request', async () => {
      const mockRecords: DNSRecord[] = [
        {
          name: 'example.com',
          type: 'A',
          ttl: 300,
          data: '192.168.1.1',
        },
      ]
      const mockResponseBuffer = createMockDNSResponse(mockRecords)

      const mockResponse = {
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(mockResponseBuffer),
      }

      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      const result = await fetchDNSQuery('1.1.1.1', 'example.com', 'A')

      expect(global.fetch).toHaveBeenCalledWith('https://1.1.1.1/dns-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/dns-message',
        },
        body: expect.any(Uint8Array),
      })
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('example.com')
      expect(result[0].type).toBe('A')
    })

    it('should include custom headers in request', async () => {
      const mockRecords: DNSRecord[] = [
        {
          name: 'example.com',
          type: 'A',
          ttl: 300,
          data: '192.168.1.1',
        },
      ]
      const mockResponseBuffer = createMockDNSResponse(mockRecords)

      const mockResponse = {
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(mockResponseBuffer),
      }

      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      await fetchDNSQuery('1.1.1.1', 'example.com', 'A', { 'X-Custom-Header': 'value' })

      expect(global.fetch).toHaveBeenCalledWith(
        'https://1.1.1.1/dns-query',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/dns-message',
            'X-Custom-Header': 'value',
          }),
        })
      )
    })

    it('should throw error when response is not ok', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
      }

      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      await expect(fetchDNSQuery('1.1.1.1', 'example.com', 'A')).rejects.toThrow('Failed: 500')
    })

    it('should handle AAAA query type', async () => {
      const mockRecords: DNSRecord[] = [
        {
          name: 'example.com',
          type: 'AAAA',
          ttl: 300,
          data: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
        },
      ]
      const mockResponseBuffer = createMockDNSResponse(mockRecords)

      const mockResponse = {
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(mockResponseBuffer),
      }

      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      const result = await fetchDNSQuery('1.1.1.1', 'example.com', 'AAAA')

      expect(global.fetch).toHaveBeenCalled()
      const callArgs = (global.fetch as jest.Mock).mock.calls[0]
      expect(callArgs[0]).toBe('https://1.1.1.1/dns-query')
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('AAAA')
    })

    it('should parse multiple records correctly', async () => {
      const mockRecords: DNSRecord[] = [
        {
          name: 'example.com',
          type: 'A',
          ttl: 300,
          data: '192.168.1.1',
        },
        {
          name: 'example.com',
          type: 'A',
          ttl: 300,
          data: '192.168.1.2',
        },
      ]
      const mockResponseBuffer = createMockDNSResponse(mockRecords)

      const mockResponse = {
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(mockResponseBuffer),
      }

      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      const result = await fetchDNSQuery('1.1.1.1', 'example.com', 'A')

      expect(result).toHaveLength(2)
      expect(result[0].data).toBe('192.168.1.1')
      expect(result[1].data).toBe('192.168.1.2')
    })
  })
})
