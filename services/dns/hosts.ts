import { convertToDNSMessage } from './fetch-dns-query'
import type { DNSRecord } from './types'

/**
 * Convert hosts file content to DNS records.
 * @param hostsContent - The content of the hosts file.
 * @param ttl - Default TTL value for DNS records (default: 300 seconds).
 * @returns An array of DNS records.
 */
export function hostsToDNSRecords(hostsContent: string, ttl = 300): DNSRecord[] {
  const records: DNSRecord[] = []

  // Split content into lines and process each line
  const lines = hostsContent.split('\n')

  for (const line of lines) {
    // Remove comments and trim whitespace
    const cleanLine = line.split('#')[0].trim()
    if (!cleanLine) continue

    // Split line into IP and hostnames
    const parts = cleanLine.split(/\s+/)
    if (parts.length < 2) continue

    const ip = parts[0]
    const hostnames = parts.slice(1)

    // Determine record type (A or AAAA) based on IP format
    const type = ip.includes(':') ? 'AAAA' : 'A'

    // Create a DNS record for each hostname
    for (const hostname of hostnames) {
      const name = hostname
      const data = ip

      records.push({ name, type, ttl, data })
    }
  }

  return records
}

/**
 * Convert hosts file content to DNS message format.
 * @param hostsContent - The content of the hosts file.
 * @param ttl - Default TTL value for DNS records (default: 300 seconds).
 * @returns An ArrayBuffer containing the DNS message.
 */
export function hostsToDNSMessage(hostsContent: string, ttl = 300): ArrayBuffer {
  const records = hostsToDNSRecords(hostsContent, ttl)
  return convertToDNSMessage(records)
}
