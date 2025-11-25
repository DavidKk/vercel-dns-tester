'use client'

import FeatherIcon from 'feather-icons-react'
import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'

import CustomHeaderInput from '@/components/CustomHeaderInput'
import DNSInput from '@/components/DNSInput'
import FormSelect from '@/components/FormSelect'
import Input from '@/components/Input'
import Switch from '@/components/Switch'
import { useCountdown } from '@/hooks/useCountdown'
import type { QueryType } from '@/services/dns'
import { checkOptionsSupport, fetchDNSQuery, fetchDNSResolve, isDNSQueryType, isRequestType } from '@/services/dns'
import type { DNSRecord, RequestType } from '@/services/dns/types'
import { extractDNSDomain } from '@/utils/domain'
import { stringifyUnknownError } from '@/utils/response'
import { validateDNSService } from '@/utils/validators'

import { type DNSType, isDNSType } from './api/test/types'
import DNSResultsPanel from './DNSResultsPanel'

export interface DoHPlaygroundProps {
  dnsService?: string
  dnsType?: string
  domain?: string
  queryType?: string
  requestType?: string
  isAuthenticated?: boolean
  dohApiKey?: string | null
  submit(dnsType: DNSType, dnsService: string, domain: string, queryType: QueryType, headers?: Record<string, string>): Promise<DNSRecord[]>
}

export default function DoHPlayground(props: DoHPlaygroundProps) {
  const {
    dnsService: defaultDNSService,
    dnsType: defaultDNSType,
    domain: defaultDomain,
    queryType: defaultQueryType,
    requestType: defaultRequestType,
    isAuthenticated: initialIsAuthenticated = false,
    dohApiKey: initialDohApiKey = null,
    submit,
  } = props

  const [dnsService, setDNSService] = useState<string>(defaultDNSService || '')
  const [dnsType, setDNSType] = useState<DNSType>(defaultDNSType && isDNSType(defaultDNSType) ? defaultDNSType : 'resolve')
  const [domain, setDomain] = useState<string>(defaultDomain || '')
  const [queryTypes, setQueryTypes] = useState<QueryType>(defaultQueryType && isDNSQueryType(defaultQueryType) ? defaultQueryType : 'A')
  const [requestType, setRequestType] = useState<RequestType>(() => {
    // If default is dns-query and requestType is client, force to server
    const defaultType = defaultDNSType && isDNSType(defaultDNSType) ? defaultDNSType : 'resolve'
    const defaultReqType = defaultRequestType && isRequestType(defaultRequestType) ? defaultRequestType : 'server'
    if (defaultType === 'dns-query' && defaultReqType === 'client') {
      return 'server'
    }
    return defaultReqType
  })
  interface CustomHeader {
    id: string
    name: string
    value: string
  }
  const [customHeaders, setCustomHeaders] = useState<CustomHeader[]>([])
  const [showCustomHeaders, setShowCustomHeaders] = useState<boolean>(false)

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

  // Check if current DNS service is self (current project)
  const isSelfService = useMemo(() => {
    if (typeof window === 'undefined' || !dnsService) {
      return false
    }
    const currentProjectUrl = `https://${window.location.host}`
    return dnsService === currentProjectUrl || dnsService.startsWith(currentProjectUrl)
  }, [dnsService])

  // Auto switch to server when dns-query is selected and currently on client
  useEffect(() => {
    if (dnsType === 'dns-query' && requestType === 'client') {
      setRequestType('server')
    }
  }, [dnsType, requestType])

  // Auto switch to dns-query when self service is selected and currently on resolve
  useEffect(() => {
    if (isSelfService && dnsType === 'resolve') {
      setDNSType('dns-query')
    }
  }, [isSelfService, dnsType])

  // Auto add x-doh-api-key header when authenticated and using self service
  useEffect(() => {
    if (isSelfService && initialIsAuthenticated && initialDohApiKey) {
      setCustomHeaders((prev) => {
        const apiKeyHeader = prev.find((h) => h.name === 'x-doh-api-key')
        if (!apiKeyHeader) {
          const newHeader: CustomHeader = { id: 'auto-doh-api-key', name: 'x-doh-api-key', value: initialDohApiKey }
          setShowCustomHeaders(true)
          return [...prev, newHeader]
        } else if (apiKeyHeader.value !== initialDohApiKey) {
          // Update if value changed
          return prev.map((h) => (h.id === 'auto-doh-api-key' ? { ...h, value: initialDohApiKey } : h))
        }
        return prev
      })
    } else {
      // Remove auto-added header when conditions are not met
      setCustomHeaders((prev) => {
        const filtered = prev.filter((h) => h.id !== 'auto-doh-api-key')
        if (filtered.length === 0 && prev.length > 0) {
          setShowCustomHeaders(false)
        }
        return filtered
      })
    }
  }, [isSelfService, initialIsAuthenticated, initialDohApiKey])

  const addHeader = () => {
    if (!showCustomHeaders) {
      setShowCustomHeaders(true)
    }
    const newHeader: CustomHeader = { id: Date.now().toString(), name: '', value: '' }
    setCustomHeaders((prev) => [...prev, newHeader])
  }

  const updateHeader = (id: string, field: 'name' | 'value', value: string) => {
    setCustomHeaders((prev) => prev.map((h) => (h.id === id ? { ...h, [field]: value } : h)))
  }

  const removeHeader = (id: string) => {
    setCustomHeaders((prev) => {
      const filtered = prev.filter((h) => h.id !== id)
      if (filtered.length === 0) {
        setShowCustomHeaders(false)
      }
      return filtered
    })
  }

  const submitByClient = async (type: DNSType, dnsService: string, domain: string, queryType: QueryType) => {
    const headers =
      customHeaders.length > 0
        ? customHeaders.reduce(
            (acc, h) => {
              if (h.name && h.value) {
                acc[h.name] = h.value
              }
              return acc
            },
            {} as Record<string, string>
          )
        : undefined

    switch (type) {
      case 'resolve':
        return fetchDNSResolve(dnsService, domain, queryType, headers)
      case 'dns-query': {
        // Preflight OPTIONS check for DNS Query endpoint
        // Most DNS servers don't support OPTIONS, so we check first
        const supportsOptions = await checkOptionsSupport(dnsService, headers)
        if (!supportsOptions) {
          throw new Error('DNS server does not support OPTIONS preflight requests. Please use Server mode instead, or the DNS server may not support CORS.')
        }
        return fetchDNSQuery(dnsService, domain, queryType, headers)
      }
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
      const headers =
        customHeaders.length > 0
          ? customHeaders.reduce(
              (acc, h) => {
                if (h.name && h.value) {
                  acc[h.name] = h.value
                }
                return acc
              },
              {} as Record<string, string>
            )
          : undefined
      const fn = requestType === 'server' ? submit : submitByClient
      const result = requestType === 'server' ? await fn(dnsType, dnsServiceDomain, domain, queryTypes, headers) : await fn(dnsType, dnsServiceDomain, domain, queryTypes)
      setRecords(result)
    } catch (error) {
      const message = stringifyUnknownError(error)
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const isDoHService = (value: string): boolean => {
    const trimmed = value.trim().toLowerCase()
    return trimmed.startsWith('https://')
  }

  const dnsServiceValidation = useMemo(() => validateDNSService(dnsService), [dnsService])

  const handleDNSServiceChange = (newValue: string) => {
    setDNSService(newValue)
    const trimmed = newValue.trim()

    if (!trimmed) {
      return
    }

    if (isDoHService(trimmed)) {
      // HTTPS URL -> DNS Query endpoint
      setDNSType('dns-query')
      // Auto switch to server if currently on client
      if (requestType === 'client') {
        setRequestType('server')
      }
    } else {
      // IP address -> Resolve endpoint
      setDNSType('resolve')
    }
  }

  const dnsTypeOptions: { label: string; value: DNSType; disabled?: boolean }[] = useMemo(
    () => [
      { label: 'Resolve endpoint', value: 'resolve', disabled: isSelfService },
      { label: 'DNS Query endpoint', value: 'dns-query' },
    ],
    [isSelfService]
  )

  const queryTypeOptions: { label: string; value: QueryType }[] = useMemo(
    () => [
      { label: 'A', value: 'A' },
      { label: 'AAAA', value: 'AAAA' },
      { label: 'CNAME', value: 'CNAME' as QueryType },
      { label: 'MX', value: 'MX' as QueryType },
      { label: 'NS', value: 'NS' as QueryType },
      { label: 'TXT', value: 'TXT' as QueryType },
    ],
    []
  )

  const requestModes: { label: string; value: RequestType; helper: string }[] = useMemo(
    () => [
      { label: 'Server', value: 'server', helper: 'Proxy via edge/server runtime' },
      { label: 'Client', value: 'client', helper: 'Fetch directly from the browser' },
    ],
    []
  )

  const currentRequestMode = useMemo(() => requestModes.find((mode) => mode.value === requestType), [requestModes, requestType])

  const switchOptions = useMemo(
    () =>
      requestModes.map(({ label, value }) => ({
        label,
        value,
        disabled: dnsType === 'dns-query' && value === 'client',
      })),
    [requestModes, dnsType]
  )

  return (
    <section className="mx-auto w-full text-black">
      <div className="flex flex-col gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-wide text-slate-500">Playground form</p>
                <h2 className="text-2xl font-semibold text-slate-900">Run a DoH query</h2>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">Default endpoint: {defaultDNSService || '—'}</div>
            </div>

            <form onSubmit={handleTest} className="flex w-full flex-col gap-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-left md:col-span-2">
                  <span className="text-sm font-medium text-slate-700">DNS service endpoint</span>
                  <DNSInput
                    value={dnsService}
                    onChange={handleDNSServiceChange}
                    onSelect={handleDNSServiceChange}
                    className={`${!dnsServiceValidation.isValid ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                    placeholder="https://dns.google or 1.1.1.1"
                  />
                  {dnsService && (
                    <p className={`text-xs ${dnsServiceValidation.isValid ? 'text-slate-500' : 'text-red-600'}`}>
                      {dnsServiceValidation.message || 'Consider using system default DNS if available'}
                    </p>
                  )}
                  {isSelfService && (
                    <div className="flex items-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2">
                      <FeatherIcon icon="info" size={16} className="flex-shrink-0 text-yellow-600" />
                      <p className="flex-1 text-xs text-yellow-800">Custom header x-doh-api-key can be used for private DNS</p>
                    </div>
                  )}
                </label>

                <FormSelect
                  label="Interface type"
                  value={dnsType}
                  onChange={(next) => {
                    setDNSType(next as DNSType)
                    // Auto switch to server if dns-query is selected and currently on client
                    if (next === 'dns-query' && requestType === 'client') {
                      setRequestType('server')
                    }
                  }}
                  options={dnsTypeOptions}
                />

                <FormSelect label="Query type" value={queryTypes} onChange={(next) => setQueryTypes(next as QueryType)} options={queryTypeOptions} />

                <div className="md:col-span-2">
                  <Input label="Domain to test" type="text" value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="example.com" />
                </div>
              </div>

              <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex min-w-[220px] flex-1 flex-col gap-1">
                    <p className="text-sm font-medium text-slate-700">Request origin</p>
                    <p className="text-xs text-slate-500">{currentRequestMode?.helper}</p>
                  </div>
                  <Switch
                    className="shrink-0"
                    options={switchOptions}
                    value={requestType}
                    onChange={(next) => setRequestType(next as RequestType)}
                    disabled={dnsType === 'dns-query'}
                  />
                </div>
                {dnsType === 'dns-query' && (
                  <div className="flex items-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2">
                    <FeatherIcon icon="alert-triangle" size={16} className="flex-shrink-0 text-yellow-600" />
                    <p className="flex-1 text-xs text-yellow-800">
                      DNS Query endpoint requires Server mode due to CORS preflight limitations. Most DNS servers do not support OPTIONS requests from browsers.
                    </p>
                  </div>
                )}
              </div>

              {!showCustomHeaders || customHeaders.length === 0 ? (
                <button
                  type="button"
                  onClick={addHeader}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  + Add custom headers
                </button>
              ) : (
                <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Custom headers</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={addHeader}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        + Add header
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustomHeaders(false)
                          setCustomHeaders([])
                        }}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-50"
                      >
                        Hide
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {customHeaders.map((header) => (
                      <div key={header.id} className="flex gap-2">
                        <CustomHeaderInput
                          value={header.name}
                          onChange={(value) => updateHeader(header.id, 'name', value)}
                          onSelect={(value) => updateHeader(header.id, 'name', value)}
                          className="flex-1"
                          placeholder="Header key (e.g., X-DOH-API-KEY)"
                        />
                        <Input
                          type="text"
                          value={header.value}
                          onChange={(e) => updateHeader(header.id, 'value', e.target.value)}
                          className="flex-1"
                          placeholder="Header value (plaintext)"
                        />
                        <button
                          type="button"
                          onClick={() => removeHeader(header.id)}
                          className="rounded-lg border border-red-300 bg-white px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">Custom headers will be included in all DoH requests</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-lg bg-indigo-500 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-600 hover:shadow-indigo-500/40"
              >
                Run test
              </button>
            </form>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50/80 p-4 text-red-700 shadow-sm" role="alert" aria-live="assertive">
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
        </div>

        <DNSResultsPanel records={records} loading={isLoading} className="min-w-0" />
      </div>
    </section>
  )
}
