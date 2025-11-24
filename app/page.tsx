import { headers } from 'next/headers'

import { testDNS } from './api/test/dns'
import DoHPlayground from './DoHPlayground'

async function getDefaultDNSService(): Promise<string> {
  try {
    const headersList = await headers()
    const host = headersList.get('host')
    const forwardedProto = headersList.get('x-forwarded-proto')
    const protocol = forwardedProto || (process.env.NODE_ENV === 'production' ? 'https' : 'http')

    // Use current project address if HTTPS is available
    if (protocol === 'https' && host) {
      return `https://${host}`
    }
  } catch {
    // Fallback to default if headers are unavailable (e.g., in client-side)
  }

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
    <main className="min-h-screen bg-slate-50 py-10">
      <section className="w-full max-w-5xl mx-auto px-6 space-y-8">
        <header className="text-center space-y-3">
          <span className="inline-flex items-center justify-center rounded-full bg-indigo-100 px-4 py-1 text-sm font-medium text-indigo-700">DNS over HTTPS playground</span>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">Validate your DoH setup instantly</h1>
            <p className="text-lg text-slate-600 max-w-4xl mx-auto">
              Provide a DoH endpoint, query type, and target domain to inspect responses in real time. Switch request origins, test multiple record types, monitor countdowns, and
              iterate without scrolling away from the form.
            </p>
          </div>
        </header>

        <DoHPlayground dnsService={defaults.dnsService} domain={defaults.domain} queryType={defaults.queryType} submit={testDNS} />
      </section>
    </main>
  )
}
