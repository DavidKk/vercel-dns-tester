import { headers } from 'next/headers'

import { testDNS } from '@/app/actions/test-dns'

import DoHPlayground from './DoHPlayground'

async function getDefaultDNSService(): Promise<string> {
  const headersList = await headers()
  const host = headersList.get('host')
  const protocol = headersList.get('x-forwarded-proto') || 'http'

  // If current service is HTTPS, use self as default
  if (protocol === 'https' && host) {
    return `https://${host}`
  }

  // Otherwise use Google DNS as default
  return 'https://dns.google'
}

export default async function Home() {
  const defaultDNSService = await getDefaultDNSService()

  const defaults = {
    dnsService: defaultDNSService,
    domain: 'example.com',
    queryType: 'A',
  }

  return (
    <main className="flex min-h-0 flex-1 overflow-hidden bg-app-subtle text-app-text">
      <section className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-4 md:px-6 lg:px-8">
        <DoHPlayground dnsService={defaults.dnsService} domain={defaults.domain} queryType={defaults.queryType} submit={testDNS} />
      </section>
    </main>
  )
}
