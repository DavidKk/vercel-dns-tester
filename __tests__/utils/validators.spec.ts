import { isValidHTTPS, isValidIP, isValidIPv4, isValidIPv6, validateDNSService } from '@/utils/validators'

describe('validators', () => {
  describe('isValidIPv4', () => {
    it('should return true for valid IPv4 addresses', () => {
      expect(isValidIPv4('192.168.1.1')).toBe(true)
      expect(isValidIPv4('1.1.1.1')).toBe(true)
      expect(isValidIPv4('255.255.255.255')).toBe(true)
      expect(isValidIPv4('0.0.0.0')).toBe(true)
      expect(isValidIPv4('10.0.0.1')).toBe(true)
    })

    it('should return false for invalid IPv4 addresses', () => {
      expect(isValidIPv4('256.1.1.1')).toBe(false) // Out of range
      expect(isValidIPv4('192.168.1')).toBe(false) // Missing octet
      expect(isValidIPv4('192.168.1.1.1')).toBe(false) // Too many octets
      expect(isValidIPv4('192.168.1.1a')).toBe(false) // Invalid character
      expect(isValidIPv4('192.168.01.1')).toBe(false) // Leading zero
      expect(isValidIPv4('')).toBe(false) // Empty string
      expect(isValidIPv4('192.168.-1.1')).toBe(false) // Negative number
    })
  })

  describe('isValidIPv6', () => {
    it('should return true for valid IPv6 addresses', () => {
      expect(isValidIPv6('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true)
      expect(isValidIPv6('::1')).toBe(true) // Localhost
      expect(isValidIPv6('::')).toBe(true) // Unspecified
      expect(isValidIPv6('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true)
      // Note: Simplified regex may not match all compressed IPv6 formats
    })

    it('should return false for invalid IPv6 addresses', () => {
      expect(isValidIPv6('2001:0db8:85a3:0000:0000:8a2e:0370:7334:1234')).toBe(false) // Too many segments
      expect(isValidIPv6('2001:0db8:85a3')).toBe(false) // Too few segments
      expect(isValidIPv6('2001:0db8:85a3::8a2e:0370:7334:1234')).toBe(false) // Invalid format
      expect(isValidIPv6('')).toBe(false) // Empty string
      expect(isValidIPv6('192.168.1.1')).toBe(false) // IPv4 address
    })
  })

  describe('isValidIP', () => {
    it('should return true for valid IPv4 addresses', () => {
      expect(isValidIP('192.168.1.1')).toBe(true)
      expect(isValidIP('1.1.1.1')).toBe(true)
    })

    it('should return true for valid IPv6 addresses', () => {
      expect(isValidIP('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true)
      expect(isValidIP('::1')).toBe(true)
    })

    it('should return false for invalid IP addresses', () => {
      expect(isValidIP('256.1.1.1')).toBe(false)
      expect(isValidIP('invalid')).toBe(false)
      expect(isValidIP('')).toBe(false)
      expect(isValidIP('https://dns.google')).toBe(false)
    })
  })

  describe('isValidHTTPS', () => {
    it('should return true for valid HTTPS URLs', () => {
      expect(isValidHTTPS('https://dns.google')).toBe(true)
      expect(isValidHTTPS('https://dns.google/dns-query')).toBe(true)
      expect(isValidHTTPS('https://example.com')).toBe(true)
      expect(isValidHTTPS('https://subdomain.example.com/path')).toBe(true)
      expect(isValidHTTPS('https://example.com:443')).toBe(true)
    })

    it('should return false for invalid HTTPS URLs', () => {
      expect(isValidHTTPS('http://dns.google')).toBe(false) // HTTP not HTTPS
      expect(isValidHTTPS('dns.google')).toBe(false) // Missing protocol
      expect(isValidHTTPS('https://')).toBe(false) // Invalid URL
      expect(isValidHTTPS('https://')).toBe(false) // Empty host
      expect(isValidHTTPS('')).toBe(false) // Empty string
      expect(isValidHTTPS('ftp://example.com')).toBe(false) // Wrong protocol
    })
  })

  describe('validateDNSService', () => {
    it('should return valid for empty string (system default)', () => {
      const result = validateDNSService('')
      expect(result.isValid).toBe(true)
      expect(result.message).toBe('Using system default DNS (if available)')
    })

    it('should return valid for valid IPv4 addresses', () => {
      const result = validateDNSService('1.1.1.1')
      expect(result.isValid).toBe(true)
      expect(result.message).toContain('IPv4')
      expect(result.message).toContain('Resolve endpoint')
    })

    it('should return valid for valid IPv6 addresses', () => {
      const result = validateDNSService('2001:0db8:85a3:0000:0000:8a2e:0370:7334')
      expect(result.isValid).toBe(true)
      expect(result.message).toContain('IPv6')
      expect(result.message).toContain('Resolve endpoint')
    })

    it('should return valid for valid HTTPS URLs', () => {
      const result = validateDNSService('https://dns.google')
      expect(result.isValid).toBe(true)
      expect(result.message).toBe('Using HTTPS URL - DNS Query endpoint')
    })

    it('should return valid for HTTPS URLs with paths', () => {
      const result = validateDNSService('https://dns.google/dns-query')
      expect(result.isValid).toBe(true)
      expect(result.message).toBe('Using HTTPS URL - DNS Query endpoint')
    })

    it('should return invalid for invalid formats', () => {
      const result = validateDNSService('invalid-format')
      expect(result.isValid).toBe(false)
      expect(result.message).toContain('IP address')
      expect(result.message).toContain('HTTPS URL')
    })

    it('should return invalid for HTTP URLs', () => {
      const result = validateDNSService('http://dns.google')
      expect(result.isValid).toBe(false)
      expect(result.message).toContain('IP address')
      expect(result.message).toContain('HTTPS URL')
    })

    it('should handle whitespace', () => {
      const result1 = validateDNSService('  1.1.1.1  ')
      expect(result1.isValid).toBe(true)
      expect(result1.message).toContain('IPv4')

      const result2 = validateDNSService('  https://dns.google  ')
      expect(result2.isValid).toBe(true)
      expect(result2.message).toBe('Using HTTPS URL - DNS Query endpoint')
    })

    it('should return invalid for invalid IPv4 addresses', () => {
      const result = validateDNSService('256.1.1.1')
      expect(result.isValid).toBe(false)
    })

    it('should return invalid for invalid HTTPS URLs', () => {
      const result = validateDNSService('https://')
      expect(result.isValid).toBe(false)
    })
  })
})
