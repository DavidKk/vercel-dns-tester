import { z } from 'zod'

import { GIST_HOSTS_FILE } from '@/app/dns-query/constants'
import { type Tool, tool } from '@/initializer/mcp/tool'
import { getGistInfo, readGistFile, writeGistFile } from '@/services/gist'

import {
  addHostsEntry,
  assertSafeHostsFilename,
  hostsExists,
  lookupHostnamesForIp,
  lookupIpsForHostname,
  pairsToHostsContent,
  parseHostsContentToPairs,
  removeHostsPairs,
} from './hostsFileOps'

/**
 * Resolve optional gist filename to a validated name or the default HOSTS file.
 * @param filename Optional gist file name
 * @returns Sanitized filename key used in the gist
 */
function resolveHostsFilename(filename?: string | null): string {
  if (filename == null || filename.trim() === '') {
    return GIST_HOSTS_FILE
  }
  return assertSafeHostsFilename(filename)
}

/**
 * Read the configured gist HOSTS file from GitHub.
 * @param filename Optional gist file name (defaults to {@link GIST_HOSTS_FILE})
 * @returns Raw file text and resolved filename
 */
async function readHostsGistFile(filename?: string | null): Promise<{ fileName: string; content: string }> {
  const fileName = resolveHostsFilename(filename)
  const gist = getGistInfo()
  const content = await readGistFile({ ...gist, fileName })
  return { fileName, content: content ?? '' }
}

/**
 * Persist HOSTS text to the gist file.
 * @param fileName Target gist filename
 * @param content Full file body
 */
async function writeHostsGistFile(fileName: string, content: string): Promise<void> {
  const gist = getGistInfo()
  await writeGistFile({ ...gist, fileName, content })
}

const optionalFilenameField = z.string().optional().describe(`Optional gist filename (default: ${GIST_HOSTS_FILE}). Allowed characters: letters, digits, dot, underscore, hyphen.`)

/**
 * Build MCP tools for DNS Tester Gist HOSTS editing (stable tool names for clients).
 * @returns Map keyed by tool name
 */
export function buildDnsHostsMcpToolsMap(): Map<string, Tool> {
  const read = tool(
    'dns_hosts_read',
    `Read the Gist HOSTS file used by the DOH custom resolver (default file: ${GIST_HOSTS_FILE}). Returns raw text plus parsed IP/hostname pairs.`,
    z.object({
      filename: optionalFilenameField,
    }),
    async ({ filename }) => {
      const { fileName, content } = await readHostsGistFile(filename)
      const pairs = parseHostsContentToPairs(content)
      return { fileName, content, pairs, pairCount: pairs.length }
    }
  )

  const write = tool(
    'dns_hosts_write',
    'Replace the entire Gist HOSTS file content. Prefer dns_hosts_add / dns_hosts_remove for smaller edits.',
    z.object({
      filename: optionalFilenameField,
      content: z.string().describe('Full hosts file body to write'),
    }),
    async ({ filename, content }) => {
      const fileName = resolveHostsFilename(filename)
      const gist = getGistInfo()
      let previous = ''
      try {
        previous = (await readGistFile({ ...gist, fileName })) ?? ''
      } catch {
        previous = ''
      }
      if (previous === content) {
        return {
          ok: true as const,
          fileName,
          pairCount: parseHostsContentToPairs(content).length,
          changed: false as const,
        }
      }
      await writeHostsGistFile(fileName, content)
      return { ok: true as const, fileName, pairCount: parseHostsContentToPairs(content).length, changed: true as const }
    }
  )

  const add = tool(
    'dns_hosts_add',
    'Add or update one hostname→IP binding. position=start keeps the new binding when the file is normalized; position=end appends after removing any prior binding for that hostname. ifExists=skip does nothing when the hostname already exists.',
    z.object({
      filename: optionalFilenameField,
      ip: z.string().min(1).describe('IPv4 or IPv6 address'),
      hostname: z.string().min(1).describe('Hostname or domain'),
      position: z.enum(['start', 'end']).optional().default('end').describe('Merge order: start (prepend semantics) or end (append)'),
      ifExists: z.enum(['skip', 'overwrite']).optional().default('overwrite').describe('When hostname exists: skip or overwrite'),
    }),
    async ({ filename, ip, hostname, position, ifExists }) => {
      const { fileName, content } = await readHostsGistFile(filename)
      const next = addHostsEntry(content, ip, hostname, position, ifExists)
      const changed = next !== content
      if (!changed) {
        return {
          ok: true as const,
          fileName,
          pairCount: parseHostsContentToPairs(next).length,
          changed: false as const,
        }
      }
      await writeHostsGistFile(fileName, next)
      return {
        ok: true as const,
        fileName,
        pairCount: parseHostsContentToPairs(next).length,
        changed: true as const,
      }
    }
  )

  const remove = tool(
    'dns_hosts_remove',
    'Remove entries from the Gist HOSTS file: by hostname (all lines with that name), by IP (all hostnames on that IP), or by exact hostname+IP pair.',
    z
      .object({
        filename: optionalFilenameField,
        mode: z.enum(['by_hostname', 'by_ip', 'by_pair']),
        hostname: z.string().optional().describe('Required for by_hostname and by_pair'),
        ip: z.string().optional().describe('Required for by_ip and by_pair'),
      })
      .superRefine((val, ctx) => {
        if (val.mode === 'by_hostname' && !val.hostname?.trim()) {
          ctx.addIssue({ code: 'custom', message: 'hostname is required when mode is by_hostname' })
        }
        if (val.mode === 'by_ip' && !val.ip?.trim()) {
          ctx.addIssue({ code: 'custom', message: 'ip is required when mode is by_ip' })
        }
        if (val.mode === 'by_pair' && (!val.hostname?.trim() || !val.ip?.trim())) {
          ctx.addIssue({ code: 'custom', message: 'hostname and ip are required when mode is by_pair' })
        }
      }),
    async ({ filename, mode, hostname, ip }) => {
      const { fileName, content } = await readHostsGistFile(filename)
      const pairs = parseHostsContentToPairs(content)
      const h = hostname?.trim()
      const i = ip?.trim()
      const filtered = removeHostsPairs(pairs, mode, h, i)
      const canonicalBefore = pairsToHostsContent(pairs, false)
      const next = pairsToHostsContent(filtered, false)
      const changed = next !== canonicalBefore
      if (!changed) {
        return {
          ok: true as const,
          fileName,
          removedCount: pairs.length - filtered.length,
          pairCount: filtered.length,
          changed: false as const,
        }
      }
      await writeHostsGistFile(fileName, next)
      return {
        ok: true as const,
        fileName,
        removedCount: pairs.length - filtered.length,
        pairCount: filtered.length,
        changed: true as const,
      }
    }
  )

  const exists = tool(
    'dns_hosts_exists',
    'Check whether a hostname, IP, or exact hostname+IP pair exists in the Gist HOSTS file.',
    z
      .object({
        filename: optionalFilenameField,
        hostname: z.string().optional(),
        ip: z.string().optional(),
      })
      .refine((p) => Boolean(p.hostname?.trim()) || Boolean(p.ip?.trim()), {
        message: 'Provide hostname and/or ip (at least one non-empty)',
      }),
    async ({ filename, hostname, ip }) => {
      const { fileName, content } = await readHostsGistFile(filename)
      const pairs = parseHostsContentToPairs(content)
      const q: { hostname?: string; ip?: string } = {}
      if (hostname?.trim()) {
        q.hostname = hostname.trim()
      }
      if (ip?.trim()) {
        q.ip = ip.trim()
      }
      const result = hostsExists(pairs, q)
      return { fileName, ...result }
    }
  )

  const lookup = tool(
    'dns_hosts_lookup',
    'Resolve bindings in one direction: pass hostname to list IPs, or pass ip to list hostnames on that IP (exactly one of hostname or ip).',
    z
      .object({
        filename: optionalFilenameField,
        hostname: z.string().optional(),
        ip: z.string().optional(),
      })
      .refine(
        (p) => {
          const hasH = Boolean(p.hostname?.trim())
          const hasI = Boolean(p.ip?.trim())
          return hasH !== hasI
        },
        { message: 'Provide exactly one of hostname or ip' }
      ),
    async ({ filename, hostname, ip }) => {
      const { fileName, content } = await readHostsGistFile(filename)
      const pairs = parseHostsContentToPairs(content)
      if (hostname?.trim()) {
        const h = hostname.trim()
        return { fileName, hostname: h, ips: lookupIpsForHostname(pairs, h) }
      }
      const ipVal = ip!.trim()
      return { fileName, ip: ipVal, hostnames: lookupHostnamesForIp(pairs, ipVal) }
    }
  )

  const list = tool(
    'dns_hosts_list',
    'Return parsed IP/hostname pairs from the Gist HOSTS file (same parser as dns_hosts_read, without repeating raw content).',
    z.object({
      filename: optionalFilenameField,
    }),
    async ({ filename }) => {
      const { fileName, content } = await readHostsGistFile(filename)
      const pairs = parseHostsContentToPairs(content)
      return { fileName, pairs, pairCount: pairs.length }
    }
  )

  const summary = tool(
    'dns_hosts_tooling_summary',
    'Static summary of available dns_hosts_* MCP tools and the default gist filename for quick discovery.',
    z.object({}),
    async () => ({
      defaultFilename: GIST_HOSTS_FILE,
      tools: ['dns_hosts_read', 'dns_hosts_write', 'dns_hosts_add', 'dns_hosts_remove', 'dns_hosts_exists', 'dns_hosts_lookup', 'dns_hosts_list', 'dns_hosts_tooling_summary'],
    })
  )

  return new Map([
    [read.name, read],
    [write.name, write],
    [add.name, add],
    [remove.name, remove],
    [exists.name, exists],
    [lookup.name, lookup],
    [list.name, list],
    [summary.name, summary],
  ])
}
