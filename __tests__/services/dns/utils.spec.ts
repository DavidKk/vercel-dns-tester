import { stringifyDNSType } from '@/services/dns/utils'

describe('utils', () => {
  describe('stringifyDNSType', () => {
    it('should return correct DNS type strings', () => {
      expect(stringifyDNSType(1)).toBe('A')
      expect(stringifyDNSType(28)).toBe('AAAA')
      expect(stringifyDNSType(5)).toBe('CNAME')
      expect(stringifyDNSType(15)).toBe('MX')
      expect(stringifyDNSType(16)).toBe('TXT')
    })

    it('should return TYPE prefix for unknown types', () => {
      expect(stringifyDNSType(2)).toBe('TYPE2')
      expect(stringifyDNSType(99)).toBe('TYPE99')
      expect(stringifyDNSType(255)).toBe('TYPE255')
    })
  })
})
