/**
 * Validate IPv4 address
 * @param ip - IP address string
 * @returns true if valid IPv4 address
 */
export function isValidIPv4(ip: string): boolean {
  const parts = ip.split('.')
  if (parts.length !== 4) return false
  return parts.every((part) => {
    const num = parseInt(part, 10)
    return !Number.isNaN(num) && num >= 0 && num <= 255 && part === num.toString()
  })
}

/**
 * Validate IPv6 address (simplified check)
 * @param ip - IP address string
 * @returns true if valid IPv6 address
 */
export function isValidIPv6(ip: string): boolean {
  // Basic IPv6 validation (can be enhanced)
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$|^([0-9a-fA-F]{1,4}:)*::([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$/
  return ipv6Regex.test(ip)
}

/**
 * Check if a string is a valid IP address (IPv4 or IPv6)
 * @param ip - IP address string
 * @returns true if valid IP address
 */
export function isValidIP(ip: string): boolean {
  return isValidIPv4(ip) || isValidIPv6(ip)
}

/**
 * Check if a string is a valid HTTPS URL
 * @param url - URL string
 * @returns true if valid HTTPS URL
 */
export function isValidHTTPS(url: string): boolean {
  if (!url.startsWith('https://')) {
    return false
  }
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export interface DNSServiceValidationResult {
  isValid: boolean
  message?: string
}

/**
 * Validate DNS service endpoint
 * @param value - DNS service endpoint value
 * @returns Validation result with message
 */
export function validateDNSService(value: string): DNSServiceValidationResult {
  const trimmed = value.trim()
  if (!trimmed) {
    return { isValid: true, message: 'Using system default DNS (if available)' } // Empty is valid (will use default)
  }

  // Check if it's an IP address (IPv4 or IPv6)
  const isIPv4 = isValidIPv4(trimmed)
  const isIPv6 = isValidIPv6(trimmed)
  const isIP = isIPv4 || isIPv6

  // Check if it starts with https://
  const isHTTPS = isValidHTTPS(trimmed)

  if (isIP) {
    return { isValid: true, message: `Using IP address (${isIPv4 ? 'IPv4' : 'IPv6'}) - Resolve endpoint` }
  }

  if (isHTTPS) {
    return { isValid: true, message: 'Using HTTPS URL - DNS Query endpoint' }
  }

  // If neither IP nor HTTPS, suggest using system default or valid format
  return {
    isValid: false,
    message: 'Please use an IP address (e.g., 1.1.1.1) or HTTPS URL (e.g., https://dns.google). Consider using system default DNS if available.',
  }
}
