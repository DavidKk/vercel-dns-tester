import type { NextRequest } from 'next/server'

import { testDNS } from '@/app/actions/test-dns'
import { api } from '@/initializer/controller'

export const POST = api(async (req: NextRequest) => {
  const { dnsService, domain, queryType } = await req.json()
  if (!dnsService || !domain || !queryType) {
    throw new Error('Missing required parameters')
  }

  return testDNS(queryType, dnsService, domain, queryType)
})
