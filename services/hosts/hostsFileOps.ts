/**
 * One logical mapping from a hosts file line (hostname is unique in the merged view).
 */
export interface HostsPair {
  /** IPv4 or IPv6 address */
  ip: string
  /** Hostname / domain */
  hostname: string
}

const FILENAME_SAFE = /^[a-zA-Z0-9._-]+$/

/**
 * Validate a Gist filename for MCP HOSTS tools (prevent path-like values).
 * @param filename Requested filename
 * @returns Trimmed safe filename
 */
export function assertSafeHostsFilename(filename: string): string {
  const trimmed = filename.trim()
  if (!trimmed || trimmed.length > 128 || !FILENAME_SAFE.test(trimmed)) {
    throw new Error('Invalid filename: use only letters, digits, dot, underscore, hyphen (max 128 chars)')
  }
  return trimmed
}

/**
 * Parse hosts content into IP/hostname pairs (comments and blank lines ignored; multiple hostnames per line supported).
 * @param content Raw hosts file text
 * @returns Ordered list of pairs as they appear
 */
export function parseHostsContentToPairs(content: string): HostsPair[] {
  const pairs: HostsPair[] = []
  for (const line of content.split('\n')) {
    const cleanLine = line.split('#')[0].trim()
    if (!cleanLine) continue
    const parts = cleanLine.split(/\s+/)
    if (parts.length < 2) continue
    const ip = parts[0]
    for (const hostname of parts.slice(1)) {
      const h = hostname.trim()
      if (h) {
        pairs.push({ ip: ip.trim(), hostname: h })
      }
    }
  }
  return pairs
}

/**
 * Serialize pairs into stable hosts lines (one line per IP, hostnames sorted, IPs sorted).
 * @param pairs Logical pairs in order; when `preferFirstHostname`, first occurrence of each hostname wins, otherwise last wins
 * @param preferFirstHostname When true, earlier pairs win on duplicate hostnames (for prepend-style adds)
 * @returns Hosts file text
 */
export function pairsToHostsContent(pairs: HostsPair[], preferFirstHostname = false): string {
  const hostToIp = new Map<string, string>()
  if (preferFirstHostname) {
    for (const { ip, hostname } of pairs) {
      if (!hostToIp.has(hostname)) {
        hostToIp.set(hostname, ip)
      }
    }
  } else {
    for (const { ip, hostname } of pairs) {
      hostToIp.set(hostname, ip)
    }
  }
  const byIp = new Map<string, Set<string>>()
  for (const [hostname, ip] of hostToIp) {
    if (!byIp.has(ip)) {
      byIp.set(ip, new Set())
    }
    byIp.get(ip)!.add(hostname)
  }
  const lines: string[] = []
  const ipsSorted = [...byIp.keys()].sort()
  for (const ip of ipsSorted) {
    const hosts = [...byIp.get(ip)!].sort()
    lines.push(`${ip}\t${hosts.join(' ')}`)
  }
  return lines.join('\n')
}

/**
 * Remove pairs matching hostname only, IP only, or exact hostname+IP.
 * @param pairs Current pairs
 * @param mode Removal strategy
 * @param hostname Optional hostname filter
 * @param ip Optional IP filter
 * @returns Filtered pairs
 */
export function removeHostsPairs(pairs: HostsPair[], mode: 'by_hostname' | 'by_ip' | 'by_pair', hostname?: string, ip?: string): HostsPair[] {
  if (mode === 'by_pair') {
    if (!hostname || !ip) {
      throw new Error('by_pair requires hostname and ip')
    }
    return pairs.filter((p) => !(p.hostname === hostname && p.ip === ip))
  }
  if (mode === 'by_hostname') {
    if (!hostname) {
      throw new Error('by_hostname requires hostname')
    }
    return pairs.filter((p) => p.hostname !== hostname)
  }
  if (!ip) {
    throw new Error('by_ip requires ip')
  }
  return pairs.filter((p) => p.ip !== ip)
}

/**
 * Return IPs bound to a hostname (unique, file order).
 * @param pairs Parsed pairs
 * @param hostname Hostname to look up
 * @returns Unique IPs
 */
export function lookupIpsForHostname(pairs: HostsPair[], hostname: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const p of pairs) {
    if (p.hostname === hostname && !seen.has(p.ip)) {
      seen.add(p.ip)
      out.push(p.ip)
    }
  }
  return out
}

/**
 * Return hostnames bound to an IP (unique, sorted).
 * @param pairs Parsed pairs
 * @param ip IP to look up
 * @returns Sorted unique hostnames
 */
export function lookupHostnamesForIp(pairs: HostsPair[], ip: string): string[] {
  const set = new Set<string>()
  for (const p of pairs) {
    if (p.ip === ip) {
      set.add(p.hostname)
    }
  }
  return [...set].sort()
}

/**
 * Check existence of hostname, IP, or exact pair in the file.
 * @param pairs Parsed pairs
 * @param query Hostname and/or IP (at least one required)
 * @returns Whether any matching line exists and matching rows
 */
export function hostsExists(pairs: HostsPair[], query: { hostname?: string; ip?: string }): { exists: boolean; matches: HostsPair[] } {
  const { hostname, ip } = query
  if (!hostname && !ip) {
    throw new Error('hostsExists requires hostname and/or ip')
  }
  const matches = pairs.filter((p) => {
    if (hostname && ip) {
      return p.hostname === hostname && p.ip === ip
    }
    if (hostname) {
      return p.hostname === hostname
    }
    return p.ip === ip!
  })
  return { exists: matches.length > 0, matches }
}

/**
 * Add or replace one hostname→IP binding; `start` keeps the new binding when normalizing (prepend semantics).
 * @param content Current hosts file text
 * @param ip IP address
 * @param hostname Hostname
 * @param position `start` prefers the new binding when deduplicating; `end` applies incoming after removing any prior binding for that hostname
 * @param ifExists When `skip`, return unchanged content if the hostname already exists (any IP); when `overwrite`, replace the binding
 * @returns New hosts file text
 */
export function addHostsEntry(content: string, ip: string, hostname: string, position: 'start' | 'end', ifExists: 'skip' | 'overwrite'): string {
  const trimmedIp = ip.trim()
  const trimmedHost = hostname.trim()
  if (!trimmedIp || !trimmedHost) {
    throw new Error('ip and hostname are required')
  }
  const parsed = parseHostsContentToPairs(content)
  if (ifExists === 'skip') {
    const ex = hostsExists(parsed, { hostname: trimmedHost })
    if (ex.exists) {
      return pairsToHostsContent(parsed, false)
    }
  }
  const without = parsed.filter((p) => p.hostname !== trimmedHost)
  const incoming: HostsPair = { ip: trimmedIp, hostname: trimmedHost }
  const ordered = position === 'start' ? [incoming, ...without] : [...without, incoming]
  return pairsToHostsContent(ordered, position === 'start')
}
