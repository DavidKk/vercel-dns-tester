'use server'

import type { QueryType } from '@/services/dns'
import { fetchDNSQuery, fetchDNSResolve } from '@/services/dns'

import type { DNSType } from './types'

export async function testDNS(type: DNSType, dnsService: string, domain: string, queryType: QueryType) {
  switch (type) {
    case 'resolve':
      return fetchDNSResolve(dnsService, domain, queryType)
    case 'dns-query':
      return fetchDNSQuery(dnsService, domain, queryType)
    default:
      throw new Error('Invalid DNS type')
  }
}
