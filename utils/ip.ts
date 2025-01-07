export function isIPv6(ip: string) {
  return /^[a-fA-F0-9:]+$/.test(ip)
}
