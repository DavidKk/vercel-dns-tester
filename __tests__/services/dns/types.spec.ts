import { isDNSQueryType, isRequestType } from '@/services/dns/types'

describe('types', () => {
  describe('isDNSQueryType', () => {
    it('should return true for valid DNS query types', () => {
      expect(isDNSQueryType('A')).toBe(true)
      expect(isDNSQueryType('AAAA')).toBe(true)
    })

    it('should return false for invalid DNS query types', () => {
      expect(isDNSQueryType('CNAME')).toBe(false)
      expect(isDNSQueryType('MX')).toBe(false)
      expect(isDNSQueryType('TXT')).toBe(false)
      expect(isDNSQueryType('')).toBe(false)
      expect(isDNSQueryType('invalid')).toBe(false)
    })
  })

  describe('isRequestType', () => {
    it('should return true for valid request types', () => {
      expect(isRequestType('client')).toBe(true)
      expect(isRequestType('server')).toBe(true)
    })

    it('should return false for invalid request types', () => {
      expect(isRequestType('invalid')).toBe(false)
      expect(isRequestType('')).toBe(false)
      expect(isRequestType('CLIENT')).toBe(false)
      expect(isRequestType('SERVER')).toBe(false)
    })
  })
})
