'use server'

import type { DNSType } from '@/app/api/test/types'
import type { QueryType } from '@/services/dns'
import { fetchDNSQuery, fetchDNSResolve } from '@/services/dns'

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
