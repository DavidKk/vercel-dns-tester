export type DNSType = 'resolve' | 'dns-query'

export function isDNSType(type: string): type is DNSType {
  return ['resolve', 'dns-query'].includes(type)
}
