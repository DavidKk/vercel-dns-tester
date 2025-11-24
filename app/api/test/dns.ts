'use server'

import type { QueryType } from '@/services/dns'
import { fetchDNSQuery, fetchDNSResolve } from '@/services/dns'

import type { DNSType } from './types'

export async function testDNS(type: DNSType, dnsService: string, domain: string, queryType: QueryType, headers?: Record<string, string>) {
  switch (type) {
    case 'resolve':
      return fetchDNSResolve(dnsService, domain, queryType, headers)
    case 'dns-query':
      return fetchDNSQuery(dnsService, domain, queryType, headers)
    default:
      throw new Error('Invalid DNS type')
  }
}
