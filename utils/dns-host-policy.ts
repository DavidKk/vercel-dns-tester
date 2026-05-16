/**
 * Hostnames that must not be used as upstream DoH targets from server-side public endpoints.
 */
const BLOCKED_HOSTNAMES = new Set(['localhost', 'localhost.localdomain', 'ip6-localhost', 'ip6-loopback'])

/**
 * Returns true when the host is a loopback, link-local, or private (RFC1918 / ULA) address.
 * @param host Normalized hostname or IP literal (no port)
 * @returns True when the host must be blocked for public DNS probe calls
 */
export function isBlockedPublicDnsHost(host: string): boolean {
  const normalized = host.trim().toLowerCase()
  if (!normalized) {
    return true
  }

  if (BLOCKED_HOSTNAMES.has(normalized)) {
    return true
  }

  if (normalized === '::1' || normalized.startsWith('fe80:') || normalized.startsWith('fc00:') || normalized.startsWith('fd')) {
    return true
  }

  if (normalized.includes(':')) {
    return false
  }

  if (normalized === '127.0.0.1' || normalized.startsWith('127.')) {
    return true
  }

  if (normalized.startsWith('10.') || normalized.startsWith('192.168.') || normalized === '169.254.169.254') {
    return true
  }

  if (/^172\.(1[6-9]|2\d|3[01])\./.test(normalized)) {
    return true
  }

  return false
}

/**
 * Reject hosts that must not be queried from public server-side DNS tools.
 * @param host Normalized hostname or IP from {@link extractDNSDomain}
 * @throws When the host is blocked
 */
export function assertPublicDnsHostAllowed(host: string): void {
  if (isBlockedPublicDnsHost(host)) {
    throw new Error('dnsService host is not allowed (private, loopback, or link-local addresses are blocked)')
  }
}
