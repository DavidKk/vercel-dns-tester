import type { NextRequest } from 'next/server'

/**
 * Check if the request is from the same host (self-request)
 * @param req - NextRequest object
 * @returns true if the request host matches the current URL host
 */
export function isSelfRequest(req: NextRequest): boolean {
  const requestHost = req.headers.get('host')
  if (!requestHost) {
    return false
  }

  const url = new URL(req.url)
  const currentHost = url.host

  // Compare hostname (ignore port for comparison)
  const requestHostname = requestHost.split(':')[0]
  const currentHostname = currentHost.split(':')[0]

  return requestHostname === currentHostname
}
