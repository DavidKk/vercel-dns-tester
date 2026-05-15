'use client'

import { useRequest } from 'ahooks'
import { useRouter } from 'next/navigation'
import { useLayoutEffect, useMemo, useState } from 'react'
import { FiCheck, FiCopy, FiExternalLink } from 'react-icons/fi'

import { buildCursorMcpInstallDeepLink, buildCursorMcpJson, buildVsCodeMcpInstallDeepLink, MCP_INSTALL_SERVER_KEY } from '@/app/api/mcp/installSnippets'

import { McpInstallSkeleton } from './McpInstallSkeleton'

/** Neutral control / install link: same default look, accent on hover */
const ghostBtnClass =
  'inline-flex min-h-7 items-center gap-1 rounded-md border border-app-border bg-app-surface px-2 py-0.5 text-xs font-medium text-app-text transition-colors hover:border-app-accent/50 hover:bg-app-accentSoft hover:text-app-accent'

function getClientBaseUrl(): string {
  if (typeof window === 'undefined') {
    return ''
  }
  return window.location.origin
}

export type McpInstallPanelProps = {
  /**
   * Optional origin from the server so Cursor/VS Code install links use an absolute MCP URL on first paint.
   * When omitted, the panel fills from `window.location.origin` before the browser paints (via `useLayoutEffect`).
   */
  requestOrigin?: string
}

interface McpHeadersApiBody {
  code: number
  message: string
  data?: { endpoint?: string; headers?: Record<string, string> }
}

/**
 * Load MCP install headers for the signed-in session (same source as `DNS_MCP_HEADERS` on the server).
 * @returns Header map for editor install JSON (possibly empty when logged in but not configured)
 */
async function fetchDnsMcpInstallHeaders(): Promise<Record<string, string>> {
  const response = await fetch('/api/mcp/headers', { cache: 'no-store', credentials: 'include' })
  if (response.status === 401) {
    const error = new Error('unauthorized')
    error.name = 'UnauthorizedError'
    throw error
  }
  const payload = (await response.json()) as McpHeadersApiBody
  if (!response.ok || payload.code !== 0) {
    throw new Error(payload.message || 'Failed to load MCP install headers')
  }
  return payload.data?.headers ?? {}
}

/**
 * Renders DNS Tester MCP install UI: manual JSON first, then editor deep links.
 * Auth headers are loaded via `/api/mcp/headers` after mount so secrets are not embedded in public HTML.
 * The `/mcp` route is server-gated with {@link checkAccess}; 401 here is treated as an expired session and triggers a login redirect.
 * @param requestOrigin Optional scheme+host from the server (see {@link McpInstallPanelProps.requestOrigin})
 * @returns Install card with config and small install actions
 */
export function McpInstallPanel({ requestOrigin }: McpInstallPanelProps) {
  const router = useRouter()
  const fromServer = requestOrigin?.trim() ?? ''
  const [baseUrl, setBaseUrl] = useState(fromServer)
  const [jsonCopied, setJsonCopied] = useState(false)

  const {
    data: mcpHeaders,
    loading: mcpHeadersLoading,
    error: mcpHeadersError,
  } = useRequest(fetchDnsMcpInstallHeaders, {
    onError: (err) => {
      if (err instanceof Error && err.name === 'UnauthorizedError') {
        router.replace(`/login?redirectUrl=${encodeURIComponent('/mcp')}`)
      }
    },
  })

  useLayoutEffect(() => {
    if (fromServer) {
      return
    }
    const origin = getClientBaseUrl()
    if (origin) {
      setBaseUrl(origin)
    }
  }, [fromServer])

  const mcpUrl = baseUrl ? `${baseUrl}/api/mcp` : '/api/mcp'
  const cursorJson = useMemo(() => buildCursorMcpJson(mcpUrl, MCP_INSTALL_SERVER_KEY, mcpHeaders), [mcpUrl, mcpHeaders])

  const isUnauthorizedError = mcpHeadersError instanceof Error && mcpHeadersError.name === 'UnauthorizedError'

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(cursorJson)
      setJsonCopied(true)
      window.setTimeout(() => setJsonCopied(false), 1600)
    } catch {
      setJsonCopied(false)
    }
  }

  const hasAuthHeaders = Boolean(mcpHeaders && Object.keys(mcpHeaders).length > 0)

  if (mcpHeadersError && !isUnauthorizedError) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center text-app-text" role="alert">
        <p className="rounded-lg border border-app-danger bg-app-dangerSoft px-4 py-3 text-sm text-app-danger">{mcpHeadersError.message || 'Failed to load MCP install headers'}</p>
      </div>
    )
  }

  if (mcpHeadersLoading || mcpHeaders === undefined) {
    return <McpInstallSkeleton />
  }

  return (
    <section className="rounded-lg border border-app-border bg-app-surface p-5 shadow-sm sm:p-6" aria-label="MCP install">
      <div className="space-y-3 text-sm text-app-text">
        <div className="flex items-center justify-between gap-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-app-muted">Manual config</label>
          <button type="button" onClick={() => void copyJson()} className={ghostBtnClass}>
            {jsonCopied ? <FiCheck size={13} aria-hidden /> : <FiCopy size={13} aria-hidden />}
            Copy JSON
          </button>
        </div>
        <pre className="w-full min-w-0 overflow-x-auto overflow-y-visible rounded-md border border-app-border bg-app-subtle p-3 text-xs leading-relaxed text-app-text sm:text-[13px]">
          <code className="block whitespace-pre font-mono">{cursorJson}</code>
        </pre>
        {!hasAuthHeaders ? (
          <p className="text-xs leading-relaxed text-app-muted">
            MCP requests require a session or <code className="rounded bg-app-subtle px-1 py-0.5 font-mono text-[11px] text-app-text">x-api-key</code> from{' '}
            <code className="rounded bg-app-subtle px-1 py-0.5 font-mono text-[11px] text-app-text">DNS_MCP_HEADERS</code>. Sign in to embed those headers in this snippet, or add
            the key in your editor after install.
          </p>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-app-border pt-5">
        <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Install</span>
        <a href={buildCursorMcpInstallDeepLink(mcpUrl, MCP_INSTALL_SERVER_KEY, mcpHeaders)} className={ghostBtnClass} rel="noopener noreferrer">
          <FiExternalLink size={11} aria-hidden />
          Cursor
        </a>
        <a href={buildVsCodeMcpInstallDeepLink(mcpUrl, MCP_INSTALL_SERVER_KEY, 'stable', mcpHeaders)} className={ghostBtnClass} rel="noopener noreferrer">
          VS Code
        </a>
        <a href={buildVsCodeMcpInstallDeepLink(mcpUrl, MCP_INSTALL_SERVER_KEY, 'insiders', mcpHeaders)} className={ghostBtnClass} rel="noopener noreferrer">
          Insiders
        </a>
      </div>
    </section>
  )
}
