import type { NextRequest } from 'next/server'
import { hostsToDNSRecords } from '@/services/dns/hosts'
import { fetchDNSQuery } from '@/services/dns/fetch-dns-query'
import { convertToDNSMessage, parseDNSQuery } from '@/services/dns/dns-message'
import { buffer } from '@/initializer/controller'
import { setHeaders } from '@/services/context'
import { getGistInfo, readGistFile } from '@/services/gist'
import { GIST_HOSTS_FILE } from './constants'

export const GET = buffer(async (req: NextRequest) => {
  const buffer = await req.arrayBuffer()
  const { domain, queryType } = parseDNSQuery(new Uint8Array(buffer))

  const params = getGistInfo()
  const hostsContent = await readGistFile({ ...params, fileName: GIST_HOSTS_FILE })
  const hostsRecords = hostsToDNSRecords(hostsContent)

  const filterdHostsRecords = hostsRecords.filter((record) => record.name === domain && record.type === queryType)

  const fallbackRecords = await fetchDNSQuery('1.1.1.1', domain, queryType)
  const combinedRecords = [...filterdHostsRecords, ...fallbackRecords]
  const combinedResponse = convertToDNSMessage(combinedRecords)

  setHeaders({
    'Content-Type': 'application/dns-message',
  })

  return combinedResponse
})
