import type { NextRequest } from 'next/server'

import { testDNS } from '@/app/actions/test-dns'
import { isDNSType } from '@/app/api/test/types'
import { api } from '@/initializer/controller'
import { isDNSQueryType } from '@/services/dns'
import { extractDNSDomain } from '@/utils/domain'

export const POST = api(async (req: NextRequest) => {
  const body = (await req.json()) as {
    dnsService?: string
    domain?: string
    queryType?: string
    dnsType?: string
    type?: string
    headers?: Record<string, string>
  }
  const { dnsService, domain, queryType, headers } = body
  const mode = body.dnsType ?? body.type
  if (!dnsService || !domain || !queryType) {
    throw new Error('Missing required parameters: dnsService, domain, queryType')
  }
  if (!mode || !isDNSType(mode)) {
    throw new Error('Missing or invalid dnsType (or type): expected "resolve" or "dns-query"')
  }
  const dnsHost = extractDNSDomain(dnsService.trim())
  if (!dnsHost) {
    throw new Error('Invalid dnsService')
  }
  const extraHeaders =
    headers && typeof headers === 'object' && !Array.isArray(headers) ? Object.fromEntries(Object.entries(headers).filter(([, v]) => typeof v === 'string')) : undefined
  if (!isDNSQueryType(queryType)) {
    throw new Error('Invalid queryType: expected "A" or "AAAA"')
  }
  return testDNS(mode, dnsHost, domain.trim(), queryType, extraHeaders)
})
