import { z } from 'zod'

import { type Tool, tool } from '@/initializer/mcp/tool'
import { checkOptionsSupport, fetchDNSQuery, fetchDNSResolve } from '@/services/dns'
import { assertPublicDnsHostAllowed } from '@/utils/dns-host-policy'
import { extractDNSDomain } from '@/utils/domain'

/**
 * Normalize user-entered DNS service (URL, host, or IP) to a hostname used by DoH helpers.
 * @param dnsService Raw DNS endpoint from the client
 * @returns Extracted host (e.g. `dns.google`, `1.1.1.1`)
 */
function normalizeDnsHost(dnsService: string): string {
  const host = extractDNSDomain(dnsService.trim())
  if (!host) {
    throw new Error('Invalid dnsService: could not resolve a host from the value')
  }
  assertPublicDnsHostAllowed(host)
  return host
}

/**
 * Build public (no-auth) MCP tools that mirror the DNS playground: classic `/resolve` vs RFC 8484 `/dns-query`.
 * @returns Map keyed by tool name
 */
export function buildDnsProbeMcpToolsMap(): Map<string, Tool> {
  const query = tool(
    'dns_probe_query',
    'Run the same DNS checks as the web tester: mode `resolve` uses JSON `https://{host}/resolve?name=&type=`, mode `dns-query` uses `application/dns-message` POST to `https://{host}/dns-query`. Pass `dnsService` as a full HTTPS URL or bare host/IP; the host is extracted like the UI.',
    z.object({
      mode: z.enum(['resolve', 'dns-query']).describe('resolve = JSON DoH; dns-query = RFC 8484 binary DoH'),
      dnsService: z.string().min(1).describe('DoH base (e.g. https://dns.google, dns.google, or 1.1.1.1)'),
      domain: z.string().min(1).describe('Query name (FQDN)'),
      queryType: z.enum(['A', 'AAAA']).describe('Record type'),
      headers: z.record(z.string(), z.string()).optional().describe('Optional extra HTTP headers on the upstream request'),
    }),
    async ({ mode, dnsService, domain, queryType, headers }) => {
      const host = normalizeDnsHost(dnsService)
      const name = domain.trim()
      if (mode === 'resolve') {
        const records = await fetchDNSResolve(host, name, queryType, headers)
        return { mode, dnsHost: host, domain: name, queryType, records }
      }
      const records = await fetchDNSQuery(host, name, queryType, headers)
      return { mode, dnsHost: host, domain: name, queryType, records }
    }
  )

  const optionsSupport = tool(
    'dns_probe_options_support',
    'Check whether the DoH origin answers CORS OPTIONS preflight (same helper as the playground before client-side dns-query). Server-side dns_probe_query does not need this.',
    z.object({
      dnsService: z.string().min(1).describe('DoH base URL or host'),
      headers: z.record(z.string(), z.string()).optional().describe('Optional headers reflected in the preflight check'),
    }),
    async ({ dnsService, headers }) => {
      const host = normalizeDnsHost(dnsService)
      const supportsOptionsPreflight = await checkOptionsSupport(host, headers)
      return { dnsHost: host, supportsOptionsPreflight }
    }
  )

  const summary = tool('dns_probe_tooling_summary', 'List dns_probe_* tools and supported modes (public endpoint, no authentication).', z.object({}), async () => ({
    endpoint: '/api/mcp-dns',
    tools: ['dns_probe_query', 'dns_probe_options_support', 'dns_probe_tooling_summary'],
    modes: {
      resolve: 'HTTPS JSON DoH: GET https://{host}/resolve?name={domain}&type={A|AAAA}',
      'dns-query': 'RFC 8484: POST https://{host}/dns-query with application/dns-message body',
    },
    queryTypes: ['A', 'AAAA'] as const,
    dnsServiceHint: 'Accepts full https:// URL or hostname/IP; host is extracted like the home page playground.',
  }))

  return new Map([
    [query.name, query],
    [optionsSupport.name, optionsSupport],
    [summary.name, summary],
  ])
}
