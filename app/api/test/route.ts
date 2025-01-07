import type { NextRequest } from 'next/server'
import { api } from '@/services/route/api'
import { testDNS } from './dns'

export const POST = api(async (req: NextRequest) => {
  const { dnsService, domain, queryType } = await req.json()
  if (!dnsService || !domain || !queryType) {
    throw new Error('Missing required parameters')
  }

  return testDNS(queryType, dnsService, domain)
})
