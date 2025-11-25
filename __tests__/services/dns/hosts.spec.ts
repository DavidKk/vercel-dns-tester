import { hostsToDNSMessage, hostsToDNSRecords } from '@/services/dns/hosts'

describe('hosts', () => {
  describe('hostsToDNSRecords', () => {
    it('should parse simple hosts file content', () => {
      const content = '192.168.1.1 example.com'
      const records = hostsToDNSRecords(content)

      expect(records).toHaveLength(1)
      expect(records[0]).toEqual({
        name: 'example.com',
        type: 'A',
        ttl: 300,
        data: '192.168.1.1',
      })
    })

    it('should parse multiple hostnames for same IP', () => {
      const content = '192.168.1.1 example.com test.com'
      const records = hostsToDNSRecords(content)

      expect(records).toHaveLength(2)
      expect(records[0]).toEqual({
        name: 'example.com',
        type: 'A',
        ttl: 300,
        data: '192.168.1.1',
      })
      expect(records[1]).toEqual({
        name: 'test.com',
        type: 'A',
        ttl: 300,
        data: '192.168.1.1',
      })
    })

    it('should parse IPv6 addresses as AAAA records', () => {
      const content = '2001:0db8:85a3:0000:0000:8a2e:0370:7334 example.com'
      const records = hostsToDNSRecords(content)

      expect(records).toHaveLength(1)
      expect(records[0]).toEqual({
        name: 'example.com',
        type: 'AAAA',
        ttl: 300,
        data: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
      })
    })

    it('should ignore comments', () => {
      const content = '# This is a comment\n192.168.1.1 example.com # inline comment'
      const records = hostsToDNSRecords(content)

      expect(records).toHaveLength(1)
      expect(records[0].name).toBe('example.com')
    })

    it('should ignore empty lines', () => {
      const content = '\n\n192.168.1.1 example.com\n\n'
      const records = hostsToDNSRecords(content)

      expect(records).toHaveLength(1)
      expect(records[0].name).toBe('example.com')
    })

    it('should use custom TTL', () => {
      const content = '192.168.1.1 example.com'
      const records = hostsToDNSRecords(content, 600)

      expect(records[0].ttl).toBe(600)
    })

    it('should handle multiple lines', () => {
      const content = `192.168.1.1 example.com
192.168.1.2 test.com
2001:0db8::1 ipv6.com`
      const records = hostsToDNSRecords(content)

      expect(records).toHaveLength(3)
      expect(records[0].data).toBe('192.168.1.1')
      expect(records[1].data).toBe('192.168.1.2')
      expect(records[2].type).toBe('AAAA')
    })
  })

  describe('hostsToDNSMessage', () => {
    it('should convert hosts to DNS message format', () => {
      const content = '192.168.1.1 example.com'
      const message = hostsToDNSMessage(content)

      expect(message).toBeInstanceOf(ArrayBuffer)
      expect(message.byteLength).toBeGreaterThan(0)
    })

    it('should handle empty hosts content', () => {
      const content = ''
      const message = hostsToDNSMessage(content)

      expect(message).toBeInstanceOf(ArrayBuffer)
      expect(message.byteLength).toBe(12) // Header only
    })
  })
})
