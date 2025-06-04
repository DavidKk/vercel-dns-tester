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
    <div className="flex flex-col items-center p-10 pt-20">
      <div className="w-full lg:w-2/3 md:w-1/2 mx-auto mb-10">
        <Meta {...metaProps} />

        <DNSTester dnsService={dnsService} domain={domain} queryType={queryType} submit={testDNS} />
      </div>
    </div>
  )
}
