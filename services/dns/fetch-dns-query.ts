import type { DNSRecord, QueryType } from './types'
import { stringifyDNSType } from './utils'

/**
 * Perform a DNS query using the DoH (DNS over HTTPS) `dns-query` endpoint.
 * @param dns - The DNS server to query (e.g., "dns.google").
 * @param domain - The domain name to resolve (e.g., "example.com").
 * @returns A parsed array of DNS records from the response.
 */
export async function fetchDNSQuery(dns: string, domain: string, queryType: 'A' | 'AAAA'): Promise<DNSRecord[]> {
  if (!dns || !domain) {
    throw new Error('DNS and domain are required')
  }

  const queryUrl = `https://${dns}/dns-query`
  const response = await fetch(queryUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/dns-message',
    },
    body: generateDNSMessage(domain, queryType),
  })

  if (!response.ok) {
    throw new Error(`Failed: ${response.status}`)
  }

  const data = await response.arrayBuffer()
  const result = parseDNSResponse(data)
  return result
}

/**
 * Generate a DNS query message in `application/dns-message` format.
 * @param domain - The domain name to query.
 * @param queryType - The type of DNS query ("A" or "AAAA").
 * @returns A `Uint8Array` representing the DNS message.
 *
 * Message format:
 * - Header: Transaction ID, Flags, Questions, and RR counts.
 * - Question: Encoded domain name, query type, and query class.
 */
function generateDNSMessage(domain: string, queryType: QueryType): Uint8Array {
  // Transaction ID: 2 bytes
  const transactionId = new Uint8Array([0xab, 0xcd])

  // Flags: 2 bytes (standard query with recursion desired)
  const flags = new Uint8Array([0x01, 0x00])

  // Questions: 2 bytes (1 question)
  const questions = new Uint8Array([0x00, 0x01])

  // Answer RRs, Authority RRs, Additional RRs: each 2 bytes (set to 0)
  const rrs = new Uint8Array(6)

  // Convert domain name to QNAME format
  const qNameParts = domain.split('.')
  const qName = qNameParts.flatMap((part) => {
    const length = part.length
    const encodedPart = [...Buffer.from(part)]
    return [length, ...encodedPart]
  })

  // Null terminator for QNAME
  const qNameTerminator = [0x00]

  // Query Type: 2 bytes
  const queryTypeCode = queryType === 'AAAA' ? [0x00, 0x1c] : [0x00, 0x01]

  // Query Class: 2 bytes (IN = 0x0001)
  const queryClass = [0x00, 0x01]

  // Combine all parts into a single Uint8Array
  const dnsMessage = new Uint8Array([...transactionId, ...flags, ...questions, ...rrs, ...qName, ...qNameTerminator, ...queryTypeCode, ...queryClass])

  return dnsMessage
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
  let name = ''
  while (true) {
    const length = view.getUint8(offset)
    if (length === 0) {
      offset += 1 // End of name
      break
    }

    if ((length & 0xc0) === 0xc0) {
      // Pointer (compressed name)
      const pointer = ((length & 0x3f) << 8) | view.getUint8(offset + 1)
      const { name: pointedName } = parseName(view, pointer)
      name += pointedName
      offset += 2
      break
    }

    offset += 1
    name += String.fromCharCode(...new Uint8Array(view.buffer, offset, length)) + '.'
    offset += length
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
  const bytes = new Uint8Array(view.buffer, offset, length)
  return String.fromCharCode(...bytes)
}

/**
 * Convert DNS records to a binary DNS message format.
 * @param records - Array of DNS records to convert.
 * @returns An ArrayBuffer containing the DNS message.
 */
export function convertToDNSMessage(records: DNSRecord[]): ArrayBuffer {
  // Calculate total size needed for the message
  const headerSize = 12 // Fixed size for DNS header
  const questionSize = 0 // No questions in response

  // Pre-calculate sizes for all records
  const recordSizes = records.map((record) => {
    const nameSize = record.name.split('.').reduce((acc, part) => acc + part.length + 1, 1) // +1 for length byte, +1 for terminator
    const fixedSize = 10 // Type(2) + Class(2) + TTL(4) + RDLENGTH(2)
    const dataSize = record.type === 'A' ? 4 : record.type === 'AAAA' ? 16 : record.data.length
    return nameSize + fixedSize + dataSize
  })

  const totalSize = headerSize + questionSize + recordSizes.reduce((a, b) => a + b, 0)
  const buffer = new ArrayBuffer(totalSize)
  const view = new DataView(buffer)
  let offset = 0

  // Write header
  view.setUint16(0, 0xabcd) // Transaction ID
  view.setUint16(2, 0x8180) // Flags (response + recursion available)
  view.setUint16(4, 0) // Questions
  view.setUint16(6, records.length) // Answer count
  view.setUint16(8, 0) // Authority count
  view.setUint16(10, 0) // Additional count
  offset = 12

  // Write each record
  for (const record of records) {
    // Write name
    for (const part of record.name.split('.')) {
      view.setUint8(offset++, part.length)
      for (const char of part) {
        view.setUint8(offset++, char.charCodeAt(0))
      }
    }
    view.setUint8(offset++, 0) // Name terminator

    // Write type
    const typeCode = record.type === 'A' ? 1 : record.type === 'AAAA' ? 28 : 5 // 5 for CNAME
    view.setUint16(offset, typeCode)
    offset += 2

    // Write class (IN = 1)
    view.setUint16(offset, 1)
    offset += 2

    // Write TTL
    view.setUint32(offset, record.ttl)
    offset += 4

    // Write RDATA
    if (record.type === 'A') {
      const parts = record.data.split('.')
      view.setUint16(offset, 4) // RDLENGTH
      offset += 2
      for (const part of parts) {
        view.setUint8(offset++, parseInt(part))
      }
    } else if (record.type === 'AAAA') {
      view.setUint16(offset, 16) // RDLENGTH
      offset += 2
      const parts = record.data.split(':')
      for (const part of parts) {
        const value = parseInt(part || '0', 16)
        view.setUint8(offset++, value >> 8)
        view.setUint8(offset++, value & 0xff)
      }
    } else {
      const data = Buffer.from(record.data)
      view.setUint16(offset, data.length) // RDLENGTH
      offset += 2
      for (let i = 0; i < data.length; i++) {
        view.setUint8(offset++, data[i])
      }
    }
  }

  return buffer
}
