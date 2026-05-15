import { headers } from 'next/headers'

/**
 * Builds the public origin (scheme + host) for the current HTTP request.
 * Prefer `x-forwarded-*` when behind a reverse proxy (for example Vercel).
 * @returns Origin such as `https://dns-tester.example.com`, or an empty string when host is missing
 */
export async function getRequestOrigin(): Promise<string> {
  const h = await headers()
  const host = h.get('x-forwarded-host')?.split(',')[0]?.trim() ?? h.get('host')?.trim() ?? ''
  if (!host) {
    return ''
  }
  const rawProto = h.get('x-forwarded-proto')?.split(',')[0]?.trim()
  const proto = rawProto === 'http' || rawProto === 'https' ? rawProto : 'http'
  return `${proto}://${host}`
}
