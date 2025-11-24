'use client'

import type { DNSRecord } from '@/services/dns/types'

export interface DNSResultsPanelProps {
  records: DNSRecord[]
  loading?: boolean
  className?: string
}

export default function DNSResultsPanel(props: DNSResultsPanelProps) {
  const { records, loading, className } = props
  const hasRecords = records && records.length > 0

  const skeletonRows = Array.from({ length: 3 })

  return (
    <section className={`w-full min-w-0 rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-200/70 backdrop-blur ${className ?? ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Response</p>
          <h2 className="text-2xl font-semibold text-slate-900">DNS records</h2>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1 text-sm font-medium text-slate-600">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {hasRecords ? `${records.length} record${records.length > 1 ? 's' : ''}` : 'Awaiting results'}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
        {loading ? (
          <div className="space-y-3 bg-slate-50/50 p-5">
            {skeletonRows.map((_, index) => (
              <div key={index} className="animate-pulse rounded-lg bg-white/70 p-4 shadow-inner shadow-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="h-4 w-40 rounded bg-slate-200" />
                  <div className="h-4 w-24 rounded bg-slate-200" />
                </div>
                <div className="mt-3 h-3 w-full rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : hasRecords ? (
          <div className="overflow-x-auto bg-white">
            <table className="min-w-full table-fixed text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">TTL</th>
                  <th className="px-5 py-3">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((record, index) => (
                  <tr key={`${record.name}-${index}`} className="transition hover:bg-indigo-50/50">
                    <td className="px-5 py-3 font-medium text-slate-900 break-words">{record.name || '-'}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{record.type || 'N/A'}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{record.ttl ?? '—'}</td>
                    <td className="px-5 py-3">
                      <div className="max-w-full break-words rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">{record.data || 'N/A'}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-slate-50/60 p-8 text-center text-sm text-slate-500">No records yet. Submit a query to see responses here.</div>
        )}
      </div>
    </section>
  )
}
