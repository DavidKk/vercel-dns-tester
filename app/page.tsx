import Meta, { generate } from '@/components/Meta'
import DNSTester from './DNSTester'
import { testDNS } from './api/test/dns'

const { generateMetadata, metaProps } = generate({
  title: 'DoH Tester - DNS over HTTPS Testing Tool',
  description: 'A powerful DNS over HTTPS (DoH) testing tool that supports multiple DNS query types and custom HOSTS configuration, helping you verify and debug DNS resolution.',
})

export { generateMetadata }

export default function Home() {
  const dnsService = 'dns.google'
  const domain = 'example.com'
  const queryType = 'A'

  return (
    <div className="min-h-[calc(100vh-60px)] gap-4 flex flex-col bg-gray-100 p-10 py-16 text-black">
      <div className="w-2/3 mx-auto">
        <Meta {...metaProps} />
      </div>
      <DNSTester dnsService={dnsService} domain={domain} queryType={queryType} submit={testDNS} />
    </div>
  )
}
