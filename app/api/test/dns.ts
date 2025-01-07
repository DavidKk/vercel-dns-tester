'use server'

import { fetchDNSQuery, fetchDNSResolve } from '@/services/dns'
import type { DNSType } from './types'

export async function testDNS(type: DNSType, dnsService: string, domain: string) {
  switch (type) {
    case 'resolve':
      return fetchDNSResolve(dnsService, domain)
    case 'dns-query':
      return fetchDNSQuery(dnsService, domain)
    default:
      throw new Error('Invalid DNS type')
  }
}
