export interface DNSRecord {
  name: string
  type: string
  ttl: number
  data: string
}

export type QueryType = 'A' | 'AAAA'

export function isDNSQueryType(value: string): value is QueryType {
  return ['A', 'AAAA'].includes(value)
}
