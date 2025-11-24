import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { buffer } from '@/initializer/controller'
import { checkDoHAccess } from '@/services/auth/access'
import { setHeaders } from '@/services/context'
import { convertToDNSMessage, parseDNSQuery } from '@/services/dns/dns-message'
import { fetchDNSQuery } from '@/services/dns/fetch-dns-query'
import { hostsToDNSRecords } from '@/services/dns/hosts'
import { getGistInfo, readGistFile } from '@/services/gist'

import { GIST_HOSTS_FILE } from './constants'

function isSelfRequest(req: NextRequest): boolean {
  const requestHost = req.headers.get('host')
  if (!requestHost) {
    return false
  }

  const url = new URL(req.url)
  const currentHost = url.host

  // Compare hostname (ignore port for comparison)
  const requestHostname = requestHost.split(':')[0]
  const currentHostname = currentHost.split(':')[0]

  return requestHostname === currentHostname
}

export const POST = buffer(async (req: NextRequest) => {
  const hasAccess = checkDoHAccess(req)
  const isSelf = isSelfRequest(req)

  // If not authorized and not self-request, return 401
  if (!hasAccess && !isSelf) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const requestBuffer = await req.arrayBuffer()
  // eslint-disable-next-line no-console
  console.log('[dns-query] Request buffer size:', requestBuffer.byteLength)

  try {
    const { domain, queryType } = parseDNSQuery(new Uint8Array(requestBuffer))
    // eslint-disable-next-line no-console
    console.log('[dns-query] Parsed domain:', domain, 'queryType:', queryType)

    let records: Awaited<ReturnType<typeof fetchDNSQuery>> = []

    // If has access, include hosts records
    if (hasAccess) {
      const params = getGistInfo()
      const hostsContent = await readGistFile({ ...params, fileName: GIST_HOSTS_FILE })
      const hostsRecords = hostsToDNSRecords(hostsContent)
      const filterdHostsRecords = hostsRecords.filter((record) => record.name === domain && record.type === queryType)
      records = filterdHostsRecords
      // eslint-disable-next-line no-console
      console.log('[dns-query] Hosts records count:', filterdHostsRecords.length)
    }

    // Always include fallback records from 1.1.1.1
    // eslint-disable-next-line no-console
    console.log('[dns-query] Fetching fallback records from 1.1.1.1')
    const fallbackRecords = await fetchDNSQuery('1.1.1.1', domain, queryType)
    // eslint-disable-next-line no-console
    console.log('[dns-query] Fallback records count:', fallbackRecords.length)

    const combinedRecords = [...records, ...fallbackRecords]
    // eslint-disable-next-line no-console
    console.log('[dns-query] Combined records count:', combinedRecords.length)
    // eslint-disable-next-line no-console
    console.log('[dns-query] Records:', JSON.stringify(combinedRecords, null, 2))

    const combinedResponse = convertToDNSMessage(combinedRecords)
    // eslint-disable-next-line no-console
    console.log('[dns-query] Response buffer size:', combinedResponse.byteLength)

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
