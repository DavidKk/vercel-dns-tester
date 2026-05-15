'use client'

import IPAddressInput from '@/components/IPAddressInput'
import type { DNSRecord } from '@/services/dns/types'

export type TestStatus = 'ready' | 'running' | 'passed' | 'failed'

export interface DNSResultsPanelProps {
  records: DNSRecord[]
  status: TestStatus
  domain: string
  queryType: string
  error?: string | null
  errorCountdown?: number
  loading?: boolean
  className?: string
}

export default function DNSResultsPanel(props: DNSResultsPanelProps) {
  const { records, status, domain, queryType, error, errorCountdown, loading, className } = props
  const hasRecords = records && records.length > 0

  const skeletonRows = Array.from({ length: 3 })
  const statusStyles: Record<TestStatus, string> = {
    ready: 'border-app-border bg-app-surface text-app-muted',
    running: 'border-app-accent bg-app-accentSoft text-app-accent',
    passed: 'border-app-success bg-app-successSoft text-app-success',
    failed: 'border-app-danger bg-app-dangerSoft text-app-danger',
  }
  const statusLabels: Record<TestStatus, string> = {
    ready: 'Not run',
    running: 'Running',
    passed: 'Passed',
    failed: 'Failed',
  }

  return (
    <section className={`flex w-full min-w-0 flex-col overflow-hidden rounded-lg border border-app-border bg-app-surface ${className ?? ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-app-border px-5 py-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">Result</p>
          <h2 className="mt-1 text-lg font-semibold text-app-text">DNS Records</h2>
        </div>
        <div className={`inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-semibold ${statusStyles[status]}`}>{statusLabels[status]}</div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col bg-app-surface">
        <div className="grid gap-3 border-b border-app-border bg-app-surface p-4 sm:grid-cols-3">
          <div className="rounded-md border border-app-accent/15 bg-app-accentSoft/45 px-3 py-2">
            <p className="text-xs font-medium text-app-muted">Domain</p>
            <p className="mt-1 truncate font-mono text-sm font-semibold text-app-text">{domain || '-'}</p>
          </div>
          <div className="rounded-md border border-app-accent/15 bg-app-accentSoft/45 px-3 py-2">
            <p className="text-xs font-medium text-app-muted">Record</p>
            <p className="mt-1 font-mono text-sm font-semibold text-app-text">{queryType || '-'}</p>
          </div>
          <div className="rounded-md border border-app-accent/15 bg-app-accentSoft/45 px-3 py-2">
            <p className="text-xs font-medium text-app-muted">Returned</p>
            <p className="mt-1 font-mono text-sm font-semibold text-app-text">{loading ? '...' : records.length}</p>
          </div>
        </div>

        {error && (
          <div className="m-4 rounded-lg border border-app-danger bg-app-dangerSoft p-4 text-sm text-app-danger">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold">Request failed</p>
                <p className="mt-1 break-words">{error}</p>
              </div>
              {typeof errorCountdown === 'number' && (
                <span className="rounded-md bg-app-dangerSoft px-2 py-1 font-mono text-xs font-semibold text-app-danger">{errorCountdown}s</span>
              )}
            </div>
          </div>
        )}

        <div className="flex min-h-0 flex-1 overflow-hidden bg-app-surface">
          {loading ? (
            <div className="w-full space-y-3 bg-app-surface p-4">
              {skeletonRows.map((_, index) => (
                <div key={index} className="animate-pulse rounded-md border border-app-border bg-app-subtle p-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="h-4 w-40 rounded bg-app-border" />
                    <div className="h-4 w-24 rounded bg-app-border" />
                  </div>
                  <div className="mt-3 h-3 w-full rounded bg-app-subtle" />
                </div>
              ))}
            </div>
          ) : hasRecords ? (
            <div className="max-h-[360px] w-full overflow-auto bg-app-surface">
              <table className="min-w-full table-fixed text-left text-sm">
                <thead>
                  <tr className="border-b border-app-border bg-app-accentSoft/30 text-xs font-semibold uppercase tracking-wide text-app-muted">
                    <th className="w-[14%] px-5 py-3">Type</th>
                    <th className="w-[26%] px-5 py-3">Name</th>
                    <th className="px-5 py-3">Data</th>
                    <th className="w-[12%] px-5 py-3">TTL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border/70">
                  {records.map((record, index) => (
                    <tr key={`${record.name}-${index}`} className="transition hover:bg-app-accentSoft/25">
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center rounded-md bg-app-accentSoft px-2 py-1 text-xs font-semibold text-app-accent">{record.type || 'N/A'}</span>
                      </td>
                      <td className="px-5 py-3 font-medium text-app-text break-words">{record.name || '-'}</td>
                      <td className="px-5 py-3">
                        <IPAddressInput value={record.data} />
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-app-muted">{record.ttl ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex min-h-[220px] w-full flex-1 items-center justify-center bg-app-accentSoft/20 p-10 text-center">
              <div>
                <p className="text-base font-semibold text-app-text">No result yet</p>
                <p className="mt-2 text-sm text-app-muted">Run the test case to inspect DNS records.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
