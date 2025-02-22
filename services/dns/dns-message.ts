import type { DNSRecord, QueryType } from './types'

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
export function generateDNSMessage(domain: string, queryType: QueryType): Uint8Array {
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
 * 从 DNS 查询消息中解析出域名和查询类型
 * @param message - DNS 查询消息的 Uint8Array
 * @returns 包含域名和查询类型的对象
 */
export function parseDNSQuery(message: Uint8Array): { domain: string; queryType: QueryType } {
  const view = new DataView(message.buffer)

  // 跳过事务 ID (2 bytes) 和标志 (2 bytes)
  let offset = 4

  // 跳过问题计数 (2 bytes) 和资源记录计数 (6 bytes)
  offset += 8

  // 解析 QNAME (域名)
  let domain = ''
  while (true) {
    const length = view.getUint8(offset++)
    if (length === 0) break

    const labelBytes = new Uint8Array(message.buffer, offset, length)
    domain += String.fromCharCode(...labelBytes) + '.'
    offset += length
  }

  // 移除末尾的点
  domain = domain.slice(0, -1)

  // 解析查询类型 (2 bytes)
  const typeCode = view.getUint16(offset)
  const queryType: QueryType = typeCode === 0x1c ? 'AAAA' : 'A'

  return { domain, queryType }
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
