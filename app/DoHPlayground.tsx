'use client'

import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import type { IconType } from 'react-icons'
import { FiAlertTriangle, FiInfo, FiMonitor, FiServer, FiX } from 'react-icons/fi'

import CustomHeaderInput from '@/components/CustomHeaderInput'
import DNSInput from '@/components/DNSInput'
import FormSelect from '@/components/FormSelect'
import Input from '@/components/Input'
import { useCountdown } from '@/hooks/useCountdown'
import type { QueryType } from '@/services/dns'
import { checkOptionsSupport, fetchDNSQuery, fetchDNSResolve, isDNSQueryType, isRequestType } from '@/services/dns'
import type { DNSRecord, RequestType } from '@/services/dns/types'
import { extractDNSDomain } from '@/utils/domain'
import { stringifyUnknownError } from '@/utils/response'
import { validateDNSService } from '@/utils/validators'

import { type DNSType, isDNSType } from './api/test/types'
import DNSResultsPanel, { type TestStatus } from './DNSResultsPanel'

export interface DoHPlaygroundProps {
  dnsService?: string
  dnsType?: string
  domain?: string
  queryType?: string
  requestType?: string
  submit(dnsType: DNSType, dnsService: string, domain: string, queryType: QueryType, headers?: Record<string, string>): Promise<DNSRecord[]>
}

export default function DoHPlayground(props: DoHPlaygroundProps) {
  const { dnsService: defaultDNSService, dnsType: defaultDNSType, domain: defaultDomain, queryType: defaultQueryType, requestType: defaultRequestType, submit } = props

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

  const requestModes: { label: string; value: RequestType; helper: string; icon: IconType }[] = useMemo(
    () => [
      { label: 'Server', value: 'server', helper: 'Proxy via edge/server runtime', icon: FiServer },
      { label: 'Client', value: 'client', helper: 'Fetch directly from the browser', icon: FiMonitor },
    ],
    []
  )

  const testStatus: TestStatus = useMemo(() => {
    if (isLoading) {
      return 'running'
    }

    if (error) {
      return 'failed'
    }

    if (records.length > 0) {
      return 'passed'
    }

    return 'ready'
  }, [error, isLoading, records.length])

  return (
    <section className="w-full text-app-text">
      <div className="grid w-full items-stretch gap-5 xl:grid-cols-[minmax(340px,360px)_minmax(0,1fr)]">
        <form onSubmit={handleTest} className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-app-border bg-app-surface">
          <div className="flex items-center justify-between gap-3 border-b border-app-border px-5 py-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">Test Case</p>
              <h2 className="mt-1 text-lg font-semibold text-app-text">Configuration</h2>
            </div>
            <span
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${dnsServiceValidation.isValid ? 'bg-app-successSoft text-app-success' : 'bg-app-dangerSoft text-app-danger'}`}
            >
              {dnsServiceValidation.isValid ? 'Valid' : 'Invalid'}
            </span>
          </div>

          <div className="flex flex-col gap-4 p-4">
            <label className="flex flex-col gap-2 text-left">
              <span className="text-sm font-medium text-app-muted">Endpoint</span>
              <DNSInput
                value={dnsService}
                onChange={handleDNSServiceChange}
                onSelect={handleDNSServiceChange}
                className={`${!dnsServiceValidation.isValid ? 'border-app-danger focus:border-app-danger focus:ring-app-danger/15' : ''}`}
                placeholder="https://dns.google or 1.1.1.1"
              />
              {dnsService && (
                <p className={`text-xs ${dnsServiceValidation.isValid ? 'text-app-muted' : 'text-app-danger'}`}>
                  {dnsServiceValidation.message || 'Consider using system default DNS if available'}
                </p>
              )}
            </label>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <FormSelect
                label="Interface"
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

              <FormSelect label="Record" value={queryTypes} onChange={(next) => setQueryTypes(next as QueryType)} options={queryTypeOptions} />
            </div>

            <Input label="Domain" type="text" value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="example.com" />

            <div className="rounded-lg border border-app-border bg-app-surface p-3">
              <div className="grid gap-2">
                {requestModes.map((mode) => {
                  const isActive = requestType === mode.value
                  const isDisabled = dnsType === 'dns-query' && mode.value === 'client'
                  const ModeIcon = mode.icon

                  return (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => setRequestType(mode.value)}
                      disabled={isDisabled}
                      className={`flex items-start gap-3 rounded-md border p-3 text-left transition ${
                        isActive
                          ? 'border-app-accent bg-app-accentSoft/50 text-app-text shadow-sm'
                          : 'border-app-border bg-app-surface text-app-muted hover:border-app-accent/40 hover:bg-app-accentSoft/25 hover:text-app-text'
                      } ${isDisabled ? 'cursor-not-allowed opacity-50 hover:border-app-border hover:bg-app-surface hover:text-app-muted' : ''}`}
                      aria-pressed={isActive}
                    >
                      <span
                        className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${isActive ? 'bg-app-accent text-white' : 'bg-app-accentSoft text-app-accent'}`}
                      >
                        <ModeIcon size={16} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">{mode.label}</span>
                        <span className="mt-1 block text-xs leading-5">{mode.helper}</span>
                      </span>
                    </button>
                  )
                })}
              </div>

              {dnsType === 'dns-query' && (
                <div className="mt-3 flex items-start gap-2 rounded-md border border-app-warning bg-app-warningSoft px-3 py-2">
                  <FiAlertTriangle size={15} className="mt-0.5 flex-shrink-0 text-app-warning" />
                  <p className="flex-1 text-xs leading-5 text-app-warning">DNS Query endpoint uses Server mode for browser CORS compatibility.</p>
                </div>
              )}
            </div>

            {isSelfService && (
              <div className="flex items-start gap-2 rounded-md border border-app-accent bg-app-accentSoft px-3 py-2">
                <FiInfo size={15} className="mt-0.5 flex-shrink-0 text-app-accent" />
                <p className="flex-1 text-xs leading-5 text-app-accent">Use x-doh-api-key when this endpoint is private.</p>
              </div>
            )}

            <div className="rounded-lg border border-app-border">
              <div className="flex items-center justify-between gap-3 border-b border-app-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-app-muted">Headers</p>
                  <p className="text-xs text-app-muted">{customHeaders.length ? `${customHeaders.length} configured` : 'None'}</p>
                </div>
                {!showCustomHeaders || customHeaders.length === 0 ? (
                  <button
                    type="button"
                    onClick={addHeader}
                    className="rounded-md border border-app-border bg-app-surface px-3 py-2 text-xs font-medium text-app-muted transition hover:bg-app-subtle"
                  >
                    Add header
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={addHeader}
                      className="rounded-md border border-app-border bg-app-surface px-3 py-2 text-xs font-medium text-app-muted transition hover:bg-app-subtle"
                      aria-label="Add header"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomHeaders(false)
                        setCustomHeaders([])
                      }}
                      className="rounded-md border border-app-border bg-app-surface px-3 py-2 text-xs font-medium text-app-muted transition hover:bg-app-subtle"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {showCustomHeaders && customHeaders.length > 0 && (
                <div className="flex max-h-64 flex-col gap-2 overflow-y-auto bg-app-surface p-2.5">
                  {customHeaders.map((header) => (
                    <div key={header.id} className="rounded-md border border-app-border bg-app-surface p-2.5">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Header</span>
                        <button
                          type="button"
                          onClick={() => removeHeader(header.id)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-app-danger text-app-danger transition hover:bg-app-dangerSoft"
                          aria-label="Remove header"
                        >
                          <FiX size={14} />
                        </button>
                      </div>
                      <div className="grid gap-2">
                        <CustomHeaderInput
                          value={header.name}
                          onChange={(value) => updateHeader(header.id, 'name', value)}
                          onSelect={(value) => updateHeader(header.id, 'name', value)}
                          placeholder="Header key"
                        />
                        <Input type="text" value={header.value} onChange={(e) => updateHeader(header.id, 'value', e.target.value)} placeholder="Header value" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-md bg-app-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-app-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading}
            >
              {isLoading ? 'Running...' : 'Run test'}
            </button>
          </div>
        </form>

        <DNSResultsPanel
          records={records}
          status={testStatus}
          domain={domain}
          queryType={queryTypes}
          error={error}
          errorCountdown={count}
          loading={isLoading}
          className="min-w-0"
        />
      </div>
    </section>
  )
}
