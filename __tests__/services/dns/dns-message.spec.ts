import { convertToDNSMessage, generateDNSMessage, parseDNSQuery } from '@/services/dns/dns-message'
import type { DNSRecord } from '@/services/dns/types'

describe('dns-message', () => {
  describe('generateDNSMessage', () => {
    it('should generate DNS message for A query', () => {
      const message = generateDNSMessage('example.com', 'A')

      expect(message).toBeInstanceOf(Uint8Array)
      expect(message.length).toBeGreaterThan(0)
      expect(message[0]).toBe(0xab) // Transaction ID
      expect(message[1]).toBe(0xcd)
    })

    it('should generate DNS message for AAAA query', () => {
      const message = generateDNSMessage('example.com', 'AAAA')

      expect(message).toBeInstanceOf(Uint8Array)
      expect(message.length).toBeGreaterThan(0)
    })

    it('should handle different domain lengths', () => {
      const short = generateDNSMessage('a.com', 'A')
      const long = generateDNSMessage('very-long-domain-name.example.com', 'A')

      expect(long.length).toBeGreaterThan(short.length)
    })

    it('should include domain name in message', () => {
      const message = generateDNSMessage('test.example.com', 'A')
      const parsed = parseDNSQuery(message)

      // Domain should be encoded in the message and parseable
      expect(message.length).toBeGreaterThan(12) // More than just header
      expect(parsed.domain).toBe('test.example.com')
    })
  })

  describe('parseDNSQuery', () => {
    it('should parse DNS query message for A type', () => {
      const message = generateDNSMessage('example.com', 'A')
      const result = parseDNSQuery(message)

      expect(result.domain).toBe('example.com')
      expect(result.queryType).toBe('A')
    })

    it('should parse DNS query message for AAAA type', () => {
      const message = generateDNSMessage('example.com', 'AAAA')
      const result = parseDNSQuery(message)

      expect(result.domain).toBe('example.com')
      expect(result.queryType).toBe('AAAA')
    })

    it('should handle subdomains', () => {
      const message = generateDNSMessage('sub.example.com', 'A')
      const result = parseDNSQuery(message)

      expect(result.domain).toBe('sub.example.com')
    })
  })

  describe('convertToDNSMessage', () => {
    it('should convert empty records to DNS message', () => {
      const records: DNSRecord[] = []
      const message = convertToDNSMessage(records)

      expect(message).toBeInstanceOf(ArrayBuffer)
      expect(message.byteLength).toBe(12) // Header only
    })

    it('should convert A record to DNS message', () => {
      const records: DNSRecord[] = [
        {
          name: 'example.com',
          type: 'A',
          ttl: 300,
          data: '192.168.1.1',
        },
      ]
      const message = convertToDNSMessage(records)

      expect(message).toBeInstanceOf(ArrayBuffer)
      expect(message.byteLength).toBeGreaterThan(12)
    })

    it('should convert AAAA record to DNS message', () => {
      const records: DNSRecord[] = [
        {
          name: 'example.com',
          type: 'AAAA',
          ttl: 300,
          data: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
        },
      ]
      const message = convertToDNSMessage(records)

      expect(message).toBeInstanceOf(ArrayBuffer)
      expect(message.byteLength).toBeGreaterThan(12)
    })

    it('should convert multiple records to DNS message', () => {
      const records: DNSRecord[] = [
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
      const message = convertToDNSMessage(records)

      expect(message).toBeInstanceOf(ArrayBuffer)
      const view = new DataView(message)
      const answerCount = view.getUint16(6)
      expect(answerCount).toBe(2)
    })

    it('should handle CNAME records', () => {
      const records: DNSRecord[] = [
        {
          name: 'example.com',
          type: 'CNAME',
          ttl: 300,
          data: 'www.example.com',
        },
      ]
      const message = convertToDNSMessage(records)

      expect(message).toBeInstanceOf(ArrayBuffer)
      expect(message.byteLength).toBeGreaterThan(12)
    })

    it('should handle TXT records', () => {
      const records: DNSRecord[] = [
        {
          name: 'example.com',
          type: 'TXT',
          ttl: 300,
          data: 'v=spf1 include:_spf.example.com ~all',
        },
      ]
      const message = convertToDNSMessage(records)

      expect(message).toBeInstanceOf(ArrayBuffer)
      expect(message.byteLength).toBeGreaterThan(12)
    })
  })
})
