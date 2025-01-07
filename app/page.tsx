import DNSTester from './DNSTester'
import { testDNS } from './api/test/dns'

export default function Home() {
  const dnsService = 'dns.google'
  const domain = 'example.com'
  const queryType = 'A'
  return <DNSTester dnsService={dnsService} domain={domain} queryType={queryType} submit={testDNS} />
}
