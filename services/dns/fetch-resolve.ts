import { isIPv6 } from '@/utils/ip'
import type { DNSRecord } from './types'
import { stringifyDNSType } from './utils'

export interface DNSResolveResponse {
  Answer?: Array<{
    name: string
    type: number
    TTL: number
    data: string
  }>
}

export async function fetchDNSResolve(dns: string, domain: string): Promise<DNSRecord[]> {
  if (!dns || !domain) {
    throw new Error('DNS and domain are required')
  }

  const queryType = isIPv6(domain) ? 'AAAA' : 'A'
  const queryUrl = `https://${dns}/resolve?name=${domain}&type=${queryType}`
  const response = await fetch(queryUrl)
  if (!response.ok) {
    throw new Error(`Failed: ${response.status}`)
  }

  const data: DNSResolveResponse = await response.json()
  if (!data.Answer) {
    return []
  }

  const records: DNSRecord[] = data.Answer.map((answer) => ({
    name: answer.name,
    type: stringifyDNSType(answer.type),
    ttl: answer.TTL,
    data: answer.data,
  }))

  return records
}
