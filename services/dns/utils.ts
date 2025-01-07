export function stringifyDNSType(type: number): string {
  switch (type) {
    case 1:
      return 'A'
    case 28:
      return 'AAAA'
    case 5:
      return 'CNAME'
    case 15:
      return 'MX'
    case 16:
      return 'TXT'
    default:
      return `TYPE${type}`
  }
}
