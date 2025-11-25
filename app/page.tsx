import { headers } from 'next/headers'

import { validateCookie } from '@/services/auth/access'

import { testDNS } from './api/test/dns'
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
  const isAuthenticated = await validateCookie()
  const dohApiKey = isAuthenticated ? process.env.DOH_API_KEY || null : null

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

        <DoHPlayground
          dnsService={defaults.dnsService}
          domain={defaults.domain}
          queryType={defaults.queryType}
          submit={testDNS}
          isAuthenticated={isAuthenticated}
          dohApiKey={dohApiKey}
        />
      </section>
    </main>
  )
}
