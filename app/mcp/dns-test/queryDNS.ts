import { z } from 'zod'

import { tool } from '@/initializer/mcp'
import { fetchDNSQuery } from '@/services/dns'

const name = 'query_dns'
const description = 'Query DNS records for a domain using a specified DNS server'
const paramSchema = z.object({
  dnsServer: z.string().describe('The DNS server to query (e.g., "1.1.1.1", "8.8.8.8")'),
  domain: z.string().describe('The domain name to resolve (e.g., "example.com")'),
  queryType: z.enum(['A', 'AAAA']).optional().default('A').describe('The type of DNS query (A for IPv4, AAAA for IPv6)'),
})

export default tool(name, description, paramSchema, async (params) => {
  const { dnsServer, domain, queryType } = params
  try {
    const records = await fetchDNSQuery(dnsServer, domain, queryType)
    return {
      success: true,
      records,
      message: `Successfully queried ${domain} on ${dnsServer}`,
    }
  } catch (error) {
    return {
      success: false,
      records: [],
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
})
