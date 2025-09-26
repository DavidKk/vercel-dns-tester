import { z } from 'zod'
import { tool } from '@/initializer/mcp'
import { fetchDNSQuery } from '@/services/dns'

const name = 'batch_query_dns'
const description = 'Query DNS records for multiple domains using specified DNS servers'
const paramSchema = z.object({
  dnsServers: z.array(z.string()).describe('Array of DNS servers to query'),
  domains: z.array(z.string()).describe('Array of domain names to resolve'),
  queryType: z.enum(['A', 'AAAA']).optional().default('A').describe('The type of DNS query (A for IPv4, AAAA for IPv6)'),
})

export default tool(name, description, paramSchema, async (params) => {
  const { dnsServers, domains, queryType } = params
  try {
    const results = []

    for (const dnsServer of dnsServers) {
      for (const domain of domains) {
        try {
          const records = await fetchDNSQuery(dnsServer, domain, queryType)
          results.push({
            dnsServer,
            domain,
            queryType,
            success: true,
            records,
          })
        } catch (error) {
          results.push({
            dnsServer,
            domain,
            queryType,
            success: false,
            records: [],
            error: error instanceof Error ? error.message : 'Unknown error occurred',
          })
        }
      }
    }

    return {
      success: true,
      results,
      message: `Completed batch DNS query for ${domains.length} domains across ${dnsServers.length} servers`,
    }
  } catch (error) {
    return {
      success: false,
      results: [],
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
})
