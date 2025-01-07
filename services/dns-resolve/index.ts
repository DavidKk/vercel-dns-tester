import { isIPv6 } from '@/utils/ip'

export interface ResolveResponse {
  Answer?: { data: string }[]
}

export async function fetchDNSResolve(dns: string, domain: string) {
  if (!dns || !domain) {
    throw new Error('DNS and domain are required')
  }

  const queryType = isIPv6(domain) ? 'AAAA' : 'A'
  const queryUrl = `https://${dns}/resolve?name=${domain}&type=${queryType}`
  const response = await fetch(queryUrl)
  if (!response.ok) {
    throw new Error(`Failed: ${response.status}`)
  }

  const data: ResolveResponse = await response.json()
  if (!data.Answer) {
    return 'No records found'
  }

  return data.Answer.map((answer) => answer.data).join(', ')
}
