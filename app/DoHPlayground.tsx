'use client'

import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'

import FormSelect from '@/components/FormSelect'
import Switch from '@/components/Switch'
import { useCountdown } from '@/hooks/useCountdown'
import type { QueryType } from '@/services/dns'
import { fetchDNSQuery, fetchDNSResolve, isDNSQueryType, isRequestType } from '@/services/dns'
import type { DNSRecord, RequestType } from '@/services/dns/types'
import { extractDNSDomain } from '@/utils/domain'
import { stringifyUnknownError } from '@/utils/response'

import { type DNSType, isDNSType } from './api/test/types'
import DNSResultsPanel from './DNSResultsPanel'

export interface DoHPlaygroundProps {
  dnsService?: string
  dnsType?: string
  domain?: string
  queryType?: string
  requestType?: string
  submit(dnsType: DNSType, dnsService: string, domain: string, queryType: QueryType): Promise<DNSRecord[]>
}

export default function DoHPlayground(props: DoHPlaygroundProps) {
  const { dnsService: defaultDNSService, dnsType: defaultDNSType, domain: defaultDomain, queryType: defaultQueryType, requestType: defaultRequestType, submit } = props

  const [dnsService, setDNSService] = useState<string>(defaultDNSService || '')
  const [dnsType, setDNSType] = useState<DNSType>(defaultDNSType && isDNSType(defaultDNSType) ? defaultDNSType : 'resolve')
  const [domain, setDomain] = useState<string>(defaultDomain || '')
  const [queryTypes, setQueryTypes] = useState<QueryType>(defaultQueryType && isDNSQueryType(defaultQueryType) ? defaultQueryType : 'A')
  const [requestType, setRequestType] = useState<RequestType>(defaultRequestType && isRequestType(defaultRequestType) ? defaultRequestType : 'server')

  const [records, setRecords] = useState<DNSRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const { run, count } = useCountdown({
    initialCount: 5,
    onEnd: () => setError(null),
  })

  useEffect(() => {
    run()
  }, [error])

  const submitByClient = (type: DNSType, dnsService: string, domain: string, queryType: QueryType) => {
    switch (type) {
      case 'resolve':
        return fetchDNSResolve(dnsService, domain, queryType)
      case 'dns-query':
        return fetchDNSQuery(dnsService, domain, queryType)
      default:
        throw new Error('Invalid DNS type')
    }
  }

  const handleTest = async (event: FormEvent) => {
    event.preventDefault()

    setRecords([])
    setError(null)

    try {
      setIsLoading(true)
      const dnsServiceDomain = extractDNSDomain(dnsService)
      const fn = requestType === 'server' ? submit : submitByClient
      const result = await fn(dnsType, dnsServiceDomain, domain, queryTypes)
      setRecords(result)
    } catch (error) {
      const message = stringifyUnknownError(error)
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'

  const dnsTypeOptions: { label: string; value: DNSType }[] = [
    { label: 'Resolve endpoint', value: 'resolve' },
    { label: 'DNS Query endpoint', value: 'dns-query' },
  ]

  const queryTypeOptions: { label: string; value: QueryType }[] = [
    { label: 'A', value: 'A' },
    { label: 'AAAA', value: 'AAAA' },
    { label: 'CNAME', value: 'CNAME' as QueryType },
    { label: 'MX', value: 'MX' as QueryType },
    { label: 'NS', value: 'NS' as QueryType },
    { label: 'TXT', value: 'TXT' as QueryType },
  ]

  const requestModes: { label: string; value: RequestType; helper: string }[] = [
    { label: 'Server', value: 'server', helper: 'Proxy via edge/server runtime' },
    { label: 'Client', value: 'client', helper: 'Fetch directly from the browser' },
  ]
  const currentRequestMode = requestModes.find((mode) => mode.value === requestType)
  const switchOptions = requestModes.map(({ label, value }) => ({ label, value }))

  return (
    <section className="mx-auto w-full text-black">
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-wide text-slate-500">Playground form</p>
              <h2 className="text-2xl font-semibold text-slate-900">Run a DoH query</h2>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">Default endpoint: {defaultDNSService || '—'}</div>
          </div>

          <form onSubmit={handleTest} className="w-full space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-left md:col-span-2">
                <span className="text-sm font-medium text-slate-700">DNS service endpoint</span>
                <input type="text" value={dnsService} onChange={(event) => setDNSService(event.target.value)} className={`${inputClass} mt-2`} placeholder="https://dns.google" />
              </label>

              <FormSelect label="Interface type" value={dnsType} onChange={(next) => setDNSType(next as DNSType)} options={dnsTypeOptions} />

              <FormSelect label="Query type" value={queryTypes} onChange={(next) => setQueryTypes(next as QueryType)} options={queryTypeOptions} />

              <div className="md:col-span-2">
                <label className="block text-left">
                  <span className="text-sm font-medium text-slate-700">Domain to test</span>
                  <input type="text" value={domain} onChange={(event) => setDomain(event.target.value)} className={`${inputClass} mt-2`} placeholder="example.com" />
                </label>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-[220px] flex-1">
                  <p className="text-sm font-medium text-slate-700">Request origin</p>
                  <p className="text-xs text-slate-500">{currentRequestMode?.helper}</p>
                </div>
                <Switch className="shrink-0" options={switchOptions} value={requestType} onChange={(next) => setRequestType(next as RequestType)} />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-indigo-500 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-600 hover:shadow-indigo-500/40"
            >
              Run test
            </button>
          </form>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50/80 p-4 text-red-700 shadow-sm" role="alert" aria-live="assertive">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">Request failed</p>
                  <p className="text-sm">{error}</p>
                </div>
                <div className="text-lg font-bold text-red-500">{count}s</div>
              </div>
            </div>
          )}
        </div>

        <DNSResultsPanel records={records} loading={isLoading} className="min-w-0" />
      </div>
    </section>
  )
}

