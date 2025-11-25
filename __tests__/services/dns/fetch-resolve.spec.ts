import { fetchDNSResolve } from '@/services/dns/fetch-resolve'

// Mock fetch globally
global.fetch = jest.fn()

describe('fetch-resolve', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('fetchDNSResolve', () => {
    it('should throw error if dns is missing', async () => {
      await expect(fetchDNSResolve('', 'example.com', 'A')).rejects.toThrow('DNS and domain are required')
    })

    it('should throw error if domain is missing', async () => {
      await expect(fetchDNSResolve('1.1.1.1', '', 'A')).rejects.toThrow('DNS and domain are required')
    })

    it('should make correct fetch request for A query', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          Answer: [
            {
              name: 'example.com',
              type: 1,
              TTL: 300,
              data: '192.168.1.1',
            },
          ],
        }),
      }

      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      await fetchDNSResolve('1.1.1.1', 'example.com', 'A')

      expect(global.fetch).toHaveBeenCalledWith('https://1.1.1.1/resolve?name=example.com&type=A', {
        headers: undefined,
      })
    })

    it('should make correct fetch request for AAAA query', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          Answer: [
            {
              name: 'example.com',
              type: 28,
              TTL: 300,
              data: '2001:0db8::1',
            },
          ],
        }),
      }

      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      await fetchDNSResolve('1.1.1.1', 'example.com', 'AAAA')

      expect(global.fetch).toHaveBeenCalledWith('https://1.1.1.1/resolve?name=example.com&type=AAAA', {
        headers: undefined,
      })
    })

    it('should include custom headers in request', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ Answer: [] }),
      }

      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      await fetchDNSResolve('1.1.1.1', 'example.com', 'A', { 'X-Custom-Header': 'value' })

      expect(global.fetch).toHaveBeenCalledWith('https://1.1.1.1/resolve?name=example.com&type=A', {
        headers: { 'X-Custom-Header': 'value' },
      })
    })

    it('should return empty array when Answer is missing', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      }

      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      const result = await fetchDNSResolve('1.1.1.1', 'example.com', 'A')

      expect(result).toEqual([])
    })

    it('should parse response correctly', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          Answer: [
            {
              name: 'example.com',
              type: 1,
              TTL: 300,
              data: '192.168.1.1',
            },
            {
              name: 'example.com',
              type: 1,
              TTL: 300,
              data: '192.168.1.2',
            },
          ],
        }),
      }

      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      const result = await fetchDNSResolve('1.1.1.1', 'example.com', 'A')

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        name: 'example.com',
        type: 'A',
        ttl: 300,
        data: '192.168.1.1',
      })
      expect(result[1]).toEqual({
        name: 'example.com',
        type: 'A',
        ttl: 300,
        data: '192.168.1.2',
      })
    })

    it('should throw error when response is not ok', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
      }

      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      await expect(fetchDNSResolve('1.1.1.1', 'example.com', 'A')).rejects.toThrow('Failed: 500')
    })
  })
})
