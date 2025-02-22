import type { NextRequest } from 'next/server'
import { hostsToDNSRecords } from '@/services/dns/hosts'
import { convertToDNSMessage, fetchDNSQuery } from '@/services/dns/fetch-dns-query'
import { buffer } from '@/initializer/controller'
import { setHeaders } from '@/services/context'

export const GET = buffer(async (req: NextRequest) => {
  const { domain, queryType } = await req.json()
  const hostsContent = '8.8.8.8 dns.google'
  const hostsRecords = hostsToDNSRecords(hostsContent)
  const fallbackRecords = await fetchDNSQuery('1.1.1.1', domain, queryType)
  const combinedRecords = [...hostsRecords, ...fallbackRecords]
  const combinedResponse = convertToDNSMessage(combinedRecords)

  setHeaders({
    'Content-Type': 'application/dns-message',
  })

  return combinedResponse
})
