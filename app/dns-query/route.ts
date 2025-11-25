import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { buffer } from '@/initializer/controller'
import { checkDoHAccess } from '@/services/auth/access'
import { setHeaders } from '@/services/context'
import { convertToDNSMessage, parseDNSQuery } from '@/services/dns/dns-message'
import { fetchDNSQuery } from '@/services/dns/fetch-dns-query'
import { hostsToDNSRecords } from '@/services/dns/hosts'
import { getGistInfo, readGistFile } from '@/services/gist'
import { isSelfRequest } from '@/utils/request'

import { GIST_HOSTS_FILE } from './constants'

function resolveUpstreamDNS(value?: string | null): string | null {
  if (!value) {
    return null
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed)
      return url.host
    } catch {
      return null
    }
  }

  return trimmed
}

export const POST = buffer(async (req: NextRequest) => {
  const hasAccess = checkDoHAccess(req)
  const isSelf = isSelfRequest(req)

  // If not authorized and not self-request, return 401
  if (!hasAccess && !isSelf) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const requestBuffer = await req.arrayBuffer()
  const upstreamFromHeader = resolveUpstreamDNS(req.headers.get('x-dns-upstream'))
  const upstreamDNS = upstreamFromHeader || '1.1.1.1'

  try {
    const { domain, queryType } = parseDNSQuery(new Uint8Array(requestBuffer))

    let records: Awaited<ReturnType<typeof fetchDNSQuery>> = []

    // If has access, include hosts records
    if (hasAccess) {
      const params = getGistInfo()
      const hostsContent = await readGistFile({ ...params, fileName: GIST_HOSTS_FILE })
      const hostsRecords = hostsToDNSRecords(hostsContent)
      const filterdHostsRecords = hostsRecords.filter((record) => record.name === domain && record.type === queryType)
      records = filterdHostsRecords
    }

    // Always include fallback records from upstream DNS (default 1.1.1.1)
    const fallbackRecords = await fetchDNSQuery(upstreamDNS, domain, queryType)

    const combinedRecords = [...records, ...fallbackRecords]
    const combinedResponse = convertToDNSMessage(combinedRecords)

    setHeaders({
      'Content-Type': 'application/dns-message',
    })

    return combinedResponse
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[dns-query] Error:', error)
    // eslint-disable-next-line no-console
    console.error('[dns-query] Error stack:', error instanceof Error ? error.stack : String(error))
    throw error
  }
})
