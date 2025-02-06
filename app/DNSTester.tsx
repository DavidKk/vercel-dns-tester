'use client'

import type { FormEvent } from 'react'
import { useState, useEffect } from 'react'
import { extractDNSDomain } from '@/utils/domain'
import { stringifyUnknownError } from '@/utils/response'
import type { DNSRecord, RequestType } from '@/services/dns/types'
import DNSRecordTable from './DNSRecordTable'
import { isDNSType, type DNSType } from './api/test/types'
import { useCountdown } from '@/hooks/useCountdown'
import type { QueryType } from '@/services/dns'
import { fetchDNSQuery, fetchDNSResolve, isDNSQueryType, isRequestType } from '@/services/dns'

export interface DNSTesterProps {
  dnsService?: string
  dnsType?: string
  domain?: string
  queryType?: string
  requestType?: string
  submit(dnsType: DNSType, dnsService: string, domain: string, queryType: QueryType): Promise<DNSRecord[]>
}

export default function DNSTester(props: DNSTesterProps) {
  const { dnsService: defaultDNSService, dnsType: defaultDNSType, domain: defaultDomain, queryType: defaultQueryType, requestType: defaultRequestType, submit } = props

  const [dnsService, setDNSService] = useState<string>(defaultDNSService || '')
  const [dnsType, setDNSType] = useState<DNSType>(defaultDNSType && isDNSType(defaultDNSType) ? defaultDNSType : 'resolve')
  const [domain, setDomain] = useState<string>(defaultDomain || '')
  const [queryTypes, setQueryTypes] = useState<QueryType>(defaultQueryType && isDNSQueryType(defaultQueryType) ? defaultQueryType : 'A')
  const [requestType, setRequestType] = useState<RequestType>(defaultRequestType && isRequestType(defaultRequestType) ? defaultRequestType : 'server')

  const [records, setRecords] = useState<DNSRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isLoaded, setIsLoaded] = useState<boolean>(false)

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
      setIsLoaded(true)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4 text-black">
      <h1 className="font-bold mb-4 pb-2 text-3xl border-b-2 border-gray-200 mb-4 inline-block">DoH Tester</h1>
      <form onSubmit={handleTest} className="bg-white p-6 rounded-lg shadow-md w-full max-w-4xl space-y-4">
        <div>
          <label className="block font-medium mb-1">DNS Service Domain</label>
          <input
            type="text"
            value={dnsService}
            onChange={(event) => setDNSService(event.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="e.g., https://dns.google"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">DNS Interface Type</label>
          <select value={dnsType} onChange={(event) => setDNSType(event.target.value as DNSType)} className="w-full px-3 py-2 border rounded-md">
            <option value="resolve">Resolve</option>
            <option value="dns-query">DNS-Query</option>
          </select>
        </div>

        <div>
          <label className="block font-medium mb-1">Query Type</label>
          <select value={queryTypes} onChange={(event) => setQueryTypes(event.target.value as QueryType)} className="w-full px-3 py-2 border rounded-md">
            <option value="A">A</option>
            <option value="AAAA">AAAA</option>
          </select>
        </div>

        <div>
          <label className="block font-medium mb-1">Request Client</label>
          <select value={requestType} onChange={(event) => setRequestType(event.target.value as RequestType)} className="w-full px-3 py-2 border rounded-md">
            <option value="server">Server</option>
            <option value="client">Client</option>
          </select>
        </div>

        <div>
          <label className="block font-medium mb-1">Domain to Test</label>
          <input type="text" value={domain} onChange={(e) => setDomain(e.target.value)} className="w-full px-3 py-2 border rounded-md" placeholder="e.g., example.com" />
        </div>

        <button type="submit" className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600">
          Submit
        </button>
      </form>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 w-full max-w-4xl mt-4 rounded-lg shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-medium">Error:</h2>
              <p>{error}</p>
            </div>
            <div className="font-bold text-lg">{count}s</div>
          </div>
        </div>
      )}

      {isLoading || isLoaded ? <DNSRecordTable records={records} loading={isLoading} /> : null}
    </div>
  )
}
