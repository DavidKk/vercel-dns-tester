import { generateDNSMessage } from './dns-message'
import type { DNSRecord } from './types'
import { stringifyDNSType } from './utils'

/**
 * Check if the DNS server supports OPTIONS preflight requests for CORS.
 * This is a preflight check before making the actual POST request.
 * Most DNS servers don't support OPTIONS, which will cause CORS preflight to fail.
 * @param dns - The DNS server to check (e.g., "dns.google").
 * @param headers - Optional custom headers that would be sent in the actual request.
 * @returns True if OPTIONS is supported (server responds), false otherwise.
 */
export async function checkOptionsSupport(dns: string, headers?: Record<string, string>): Promise<boolean> {
  try {
    const queryUrl = `https://${dns}/dns-query`

    // Build Access-Control-Request-Headers for preflight
    const requestHeaders: string[] = ['content-type']
    if (headers) {
      requestHeaders.push(...Object.keys(headers).map((h) => h.toLowerCase()))
    }

    const response = await fetch(queryUrl, {
      method: 'OPTIONS',
      headers: {
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': requestHeaders.join(', '),
      },
    })

    // If OPTIONS returns 200-299, 204 (No Content), or 405 (Method Not Allowed), server responded
    // 405 means the server understands OPTIONS but doesn't allow it, which still indicates support
    // Network errors or CORS errors (caught in catch) mean OPTIONS is not supported
    return response.status === 204 || (response.status >= 200 && response.status < 300) || response.status === 405
  } catch {
    // Network error, CORS error, or timeout means OPTIONS is not supported
    return false
  }
}

/**
 * Perform a DNS query using the DoH (DNS over HTTPS) `dns-query` endpoint.
 * @param dns - The DNS server to query (e.g., "dns.google").
 * @param domain - The domain name to resolve (e.g., "example.com").
 * @param queryType - The DNS query type (e.g., "A", "AAAA").
 * @param headers - Optional custom headers to include in the request.
 * @returns A parsed array of DNS records from the response.
 */
export async function fetchDNSQuery(dns: string, domain: string, queryType: 'A' | 'AAAA', headers?: Record<string, string>): Promise<DNSRecord[]> {
  if (!dns || !domain) {
    throw new Error('DNS and domain are required')
  }

  const queryUrl = `https://${dns}/dns-query`

  const dnsMessage = generateDNSMessage(domain, queryType)

  try {
    const response = await fetch(queryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/dns-message',
        ...headers,
      },
      body: dnsMessage as unknown as BodyInit,
    })

    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.error('[fetchDNSQuery] Request failed:', response.status, response.statusText)
      throw new Error(`Failed: ${response.status}`)
    }

    const data = await response.arrayBuffer()

    const result = parseDNSResponse(data)

    return result
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[fetchDNSQuery] Error:', error)
    // eslint-disable-next-line no-console
    console.error('[fetchDNSQuery] Error stack:', error instanceof Error ? error.stack : String(error))
    throw error
  }
}

/**
 * Parse the DNS response in `application/dns-message` format.
 * @param buffer - The DNS response as an `ArrayBuffer`.
 * @returns An array of DNS records parsed from the response.
 *
 * The function processes:
 * 1. Header: Transaction ID, flags, question count, and answer count.
 * 2. Questions: Skipped using `skipQuestionSection`.
 * 3. Answers: Parsed as resource records with `parseResourceRecord`.
 */
function parseDNSResponse(buffer: ArrayBuffer): DNSRecord[] {
  const view = new DataView(buffer)
  const records: DNSRecord[] = []

  // Parse Header
  // const transactionId = view.getUint16(0)
  // const flags = view.getUint16(2)
  const questionCount = view.getUint16(4)
  const answerCount = view.getUint16(6)

  // Skip Header (12 bytes) and parse Questions
  let offset = 12
  for (let i = 0; i < questionCount; i++) {
    offset = skipQuestionSection(view, offset)
  }

  // Parse Answer Section
  for (let i = 0; i < answerCount; i++) {
    const { name, type, ttl, data, nextOffset } = parseResourceRecord(view, offset)
    records.push({ name, type, ttl, data })
    offset = nextOffset
  }

  return records
}

/**
 * Skip over the question section of a DNS message.
 * @param view - The `DataView` of the DNS message.
 * @param offset - The current byte offset in the message.
 * @returns The new offset after the question section.
 *
 * The question section consists of:
 * - QNAME: Encoded domain name.
 * - QTYPE: The type of DNS query (e.g., A, AAAA).
 * - QCLASS: The class of DNS query (e.g., IN for internet).
 */
function skipQuestionSection(view: DataView, offset: number): number {
  // Skip QNAME
  while (view.getUint8(offset) !== 0) {
    offset += view.getUint8(offset) + 1
  }
  offset += 1 // Skip null terminator

  // Skip QTYPE (2 bytes) and QCLASS (2 bytes)
  return offset + 4
}

/**
 * Parse a single resource record (RR) from the DNS message.
 * @param view - The `DataView` of the DNS message.
 * @param offset - The current byte offset in the message.
 * @returns The parsed resource record with name, type, TTL, and data.
 *
 * The resource record consists of:
 * - NAME: The domain name (or pointer to it).
 * - TYPE: The record type (e.g., A, AAAA, CNAME).
 * - CLASS: The record class (e.g., IN).
 * - TTL: The time-to-live for the record.
 * - RDLENGTH: The length of the RDATA field.
 * - RDATA: The record-specific data (e.g., IP address).
 */
function parseResourceRecord(view: DataView, offset: number) {
  // Parse NAME (could be a pointer or full name)
  const { name, nextOffset: nameOffset } = parseName(view, offset)
  offset = nameOffset

  // Parse TYPE (2 bytes)
  const type = view.getUint16(offset)
  offset += 2

  // Parse CLASS (2 bytes)
  // const cls = view.getUint16(offset)
  offset += 2

  // Parse TTL (4 bytes)
  const ttl = view.getUint32(offset)
  offset += 4

  // Parse RDLENGTH (2 bytes)
  const rdLength = view.getUint16(offset)
  offset += 2

  if (rdLength > view.buffer.byteLength - offset) {
    // eslint-disable-next-line no-console
    console.error('[parseResourceRecord] Invalid RDLENGTH:', rdLength, 'exceeds remaining buffer:', view.buffer.byteLength - offset)
    throw new Error(`Invalid RDLENGTH: ${rdLength}, exceeds remaining buffer: ${view.buffer.byteLength - offset}`)
  }

  // Parse RDATA
  let data = ''
  if (type === 1) {
    // A record
    data = parseIPv4(view, offset, rdLength)
  } else if (type === 28) {
    // AAAA record
    data = parseIPv6(view, offset, rdLength)
  } else {
    // Other types (e.g., CNAME, TXT)
    data = parseRawData(view, offset, rdLength)
  }

  offset += rdLength
  return { name, type: stringifyDNSType(type), ttl, data, nextOffset: offset }
}

/**
 * Parse a domain name from the DNS message.
 * @param view - The `DataView` of the DNS message.
 * @param offset - The current byte offset in the message.
 * @returns The parsed domain name and the new offset.
 *
 * Domain names can be:
 * - Fully encoded: Labels with length followed by bytes.
 * - Compressed: A pointer to another location in the message.
 */
function parseName(view: DataView, offset: number): { name: string; nextOffset: number } {
  if (offset >= view.buffer.byteLength) {
    // eslint-disable-next-line no-console
    console.error('[parseName] Offset out of bounds:', offset, 'buffer size:', view.buffer.byteLength)
    throw new Error(`Offset out of bounds: ${offset} >= ${view.buffer.byteLength}`)
  }

  let name = ''
  let depth = 0
  const maxDepth = 10 // Prevent infinite loops

  while (depth < maxDepth) {
    if (offset >= view.buffer.byteLength) {
      // eslint-disable-next-line no-console
      console.error('[parseName] Offset exceeded buffer at depth:', depth)
      throw new Error(`Offset exceeded buffer at depth: ${depth}`)
    }

    const length = view.getUint8(offset)
    if (length === 0) {
      offset += 1 // End of name
      break
    }

    if ((length & 0xc0) === 0xc0) {
      // Pointer (compressed name)
      if (offset + 1 >= view.buffer.byteLength) {
        // eslint-disable-next-line no-console
        console.error('[parseName] Pointer extends beyond buffer')
        throw new Error('Pointer extends beyond buffer')
      }
      const pointer = ((length & 0x3f) << 8) | view.getUint8(offset + 1)
      if (pointer >= view.buffer.byteLength) {
        // eslint-disable-next-line no-console
        console.error('[parseName] Invalid pointer:', pointer, 'buffer size:', view.buffer.byteLength)
        throw new Error(`Invalid pointer: ${pointer} >= ${view.buffer.byteLength}`)
      }

      const { name: pointedName } = parseName(view, pointer)
      name += pointedName
      offset += 2
      break
    }

    if (length > 63) {
      // eslint-disable-next-line no-console
      console.error('[parseName] Invalid label length:', length)
      throw new Error(`Invalid label length: ${length}`)
    }

    if (offset + 1 + length > view.buffer.byteLength) {
      // eslint-disable-next-line no-console
      console.error('[parseName] Label extends beyond buffer, length:', length, 'offset:', offset, 'buffer size:', view.buffer.byteLength)
      throw new Error(`Label extends beyond buffer: length=${length}, offset=${offset}, buffer=${view.buffer.byteLength}`)
    }

    offset += 1
    const labelBytes = new Uint8Array(view.buffer, offset, length)
    name += String.fromCharCode(...labelBytes) + '.'
    offset += length
    depth++
  }

  if (depth >= maxDepth) {
    // eslint-disable-next-line no-console
    console.error('[parseName] Max depth reached')
    throw new Error('Max depth reached while parsing name')
  }

  // Remove trailing dot
  if (name.endsWith('.')) {
    name = name.slice(0, -1)
  }

  return { name, nextOffset: offset }
}

/**
 * Parse an IPv4 address from the RDATA field.
 * @param view - The `DataView` of the DNS message.
 * @param offset - The current byte offset in the message.
 * @param length - The length of the IPv4 address (always 4 bytes).
 * @returns The IPv4 address as a string (e.g., "192.168.0.1").
 */
function parseIPv4(view: DataView, offset: number, length: number): string {
  const bytes = new Uint8Array(view.buffer, offset, length)
  return Array.from(bytes).join('.')
}

/**
 * Parse an IPv6 address from the RDATA field.
 * @param view - The `DataView` of the DNS message.
 * @param offset - The current byte offset in the message.
 * @param length - The length of the IPv6 address (always 16 bytes).
 * @returns The IPv6 address as a string (e.g., "2001:0db8:85a3:0000:0000:8a2e:0370:7334").
 */
function parseIPv6(view: DataView, offset: number, length: number): string {
  const bytes = new Uint8Array(view.buffer, offset, length)
  const ip = bytes.reduce((acc, byte, idx) => {
    const hex = byte.toString(16).padStart(2, '0')
    return idx % 2 === 0 ? `${acc}:${hex}` : acc + hex
  }, '')

  // trimStart(":")
  return ip.slice(1)
}

/**
 * Parse raw data from the RDATA field of a resource record.
 * @param view - The `DataView` of the DNS message.
 * @param offset - The current byte offset in the message.
 * @param length - The length of the raw data.
 * @returns The raw data as a string.
 */
function parseRawData(view: DataView, offset: number, length: number): string {
  if (offset + length > view.buffer.byteLength) {
    // eslint-disable-next-line no-console
    console.error('[parseRawData] Invalid length:', length, 'exceeds buffer at offset:', offset)
    throw new Error(`Invalid length: ${length}, exceeds buffer at offset: ${offset}`)
  }

  const bytes = new Uint8Array(view.buffer, offset, length)
  return bytes.length > 1000 ? Buffer.from(bytes).toString('utf8') : String.fromCharCode(...bytes)
}
