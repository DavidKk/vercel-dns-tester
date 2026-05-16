import { assertPublicDnsHostAllowed, isBlockedPublicDnsHost } from '@/utils/dns-host-policy'

describe('isBlockedPublicDnsHost', () => {
  it('should block loopback and RFC1918 hosts', () => {
    expect(isBlockedPublicDnsHost('127.0.0.1')).toBe(true)
    expect(isBlockedPublicDnsHost('10.0.0.1')).toBe(true)
    expect(isBlockedPublicDnsHost('192.168.1.1')).toBe(true)
    expect(isBlockedPublicDnsHost('172.16.0.1')).toBe(true)
    expect(isBlockedPublicDnsHost('localhost')).toBe(true)
    expect(isBlockedPublicDnsHost('::1')).toBe(true)
  })

  it('should allow public resolver hosts', () => {
    expect(isBlockedPublicDnsHost('1.1.1.1')).toBe(false)
    expect(isBlockedPublicDnsHost('dns.google')).toBe(false)
  })
})

describe('assertPublicDnsHostAllowed', () => {
  it('should throw for blocked hosts', () => {
    expect(() => assertPublicDnsHostAllowed('127.0.0.1')).toThrow(/not allowed/)
  })
})
