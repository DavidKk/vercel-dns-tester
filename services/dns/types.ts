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

export type RequestType = 'client' | 'server'

export function isRequestType(value: string): value is RequestType {
  return ['client', 'server'].includes(value)
}
