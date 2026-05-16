'use client'

import { useRequest } from 'ahooks'
import Link from 'next/link'
import { useLayoutEffect, useMemo, useState } from 'react'
import { FiCheck, FiCopy, FiExternalLink, FiEye, FiEyeOff } from 'react-icons/fi'

import {
  buildCursorMcpInstallDeepLink,
  buildCursorMcpJson,
  buildVsCodeMcpInstallDeepLink,
  MCP_INSTALL_SERVER_KEY,
  MCP_PROBE_INSTALL_SERVER_KEY,
} from '@/app/api/mcp/installSnippets'
import { maskSensitiveMcpHeadersForDisplay, MCP_SECRET_MASK } from '@/services/auth/mcpHeaderPolicy'

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

/** Session state for private HOSTS MCP install snippets */
interface DnsMcpInstallSession {
  /** True when the browser has a valid session cookie */
  signedIn: boolean
  /** Full install headers from `DNS_MCP_HEADERS` (loaded via authenticated API) */
  headers: Record<string, string>
}

/**
 * Find the configured `x-api-key` header entry (case-insensitive).
 * @param headers Install header map
 * @returns Header name and value, or null when absent
 */
function findApiKeyHeaderEntry(headers: Record<string, string>): [string, string] | null {
  const entry = Object.entries(headers).find(([name]) => name.trim().toLowerCase() === 'x-api-key')
  if (!entry || !entry[1].trim()) {
    return null
  }
  return entry
}

/**
 * Load MCP install headers for the signed-in session (same source as `DNS_MCP_HEADERS` on the server).
 * @returns Session info; guests get `signedIn: false` without throwing
 */
async function fetchDnsMcpInstallSession(): Promise<DnsMcpInstallSession> {
  const response = await fetch('/api/mcp/headers', { cache: 'no-store', credentials: 'include' })
  if (response.status === 401) {
    return { signedIn: false, headers: {} }
  }
  const payload = (await response.json()) as McpHeadersApiBody
  if (!response.ok || payload.code !== 0) {
    throw new Error(payload.message || 'Failed to load MCP install headers')
  }
  return {
    signedIn: true,
    headers: payload.data?.headers ?? {},
  }
}

export type McpProbeInstallSectionProps = {
  /** Absolute or relative MCP probe endpoint URL */
  probeMcpUrl: string
}

/**
 * Public DNS probe MCP install block (no authentication).
 * @param props Section props
 * @returns Install UI for `/api/mcp-dns`
 */
export function McpProbeInstallSection({ probeMcpUrl }: McpProbeInstallSectionProps) {
  const [probeJsonCopied, setProbeJsonCopied] = useState(false)
  const probeCursorJson = useMemo(() => buildCursorMcpJson(probeMcpUrl, MCP_PROBE_INSTALL_SERVER_KEY, undefined), [probeMcpUrl])

  async function copyProbeJson() {
    try {
      await navigator.clipboard.writeText(probeCursorJson)
      setProbeJsonCopied(true)
      window.setTimeout(() => setProbeJsonCopied(false), 1600)
    } catch {
      setProbeJsonCopied(false)
    }
  }

  return (
    <div className="space-y-3 text-sm text-app-text">
      <h2 className="text-sm font-semibold text-app-text">Public DNS probe MCP</h2>
      <p className="text-xs leading-relaxed text-app-muted">
        No sign-in required. Endpoint <code className="rounded bg-app-subtle px-1 py-0.5 font-mono text-[11px]">/api/mcp-dns</code> — tools:{' '}
        <code className="rounded bg-app-subtle px-1 py-0.5 font-mono text-[11px]">dns_probe_query</code>,{' '}
        <code className="rounded bg-app-subtle px-1 py-0.5 font-mono text-[11px]">dns_probe_options_support</code>,{' '}
        <code className="rounded bg-app-subtle px-1 py-0.5 font-mono text-[11px]">dns_probe_tooling_summary</code>.
      </p>
      <div className="flex items-center justify-between gap-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-app-muted">Manual config</label>
        <button type="button" onClick={() => void copyProbeJson()} className={ghostBtnClass}>
          {probeJsonCopied ? <FiCheck size={13} aria-hidden /> : <FiCopy size={13} aria-hidden />}
          Copy JSON
        </button>
      </div>
      <pre className="w-full min-w-0 overflow-x-auto overflow-y-visible rounded-md border border-app-border bg-app-subtle p-3 text-xs leading-relaxed text-app-text sm:text-[13px]">
        <code className="block whitespace-pre font-mono">{probeCursorJson}</code>
      </pre>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Install</span>
        <a href={buildCursorMcpInstallDeepLink(probeMcpUrl, MCP_PROBE_INSTALL_SERVER_KEY, undefined)} className={ghostBtnClass} rel="noopener noreferrer">
          <FiExternalLink size={11} aria-hidden />
          Cursor
        </a>
        <a href={buildVsCodeMcpInstallDeepLink(probeMcpUrl, MCP_PROBE_INSTALL_SERVER_KEY, 'stable', undefined)} className={ghostBtnClass} rel="noopener noreferrer">
          VS Code
        </a>
        <a href={buildVsCodeMcpInstallDeepLink(probeMcpUrl, MCP_PROBE_INSTALL_SERVER_KEY, 'insiders', undefined)} className={ghostBtnClass} rel="noopener noreferrer">
          Insiders
        </a>
      </div>
    </div>
  )
}

export type McpHostsInstallSectionProps = {
  /** Absolute or relative authenticated MCP endpoint URL */
  mcpUrl: string
  /** Full install headers (plaintext; used for copy and one-click install) */
  mcpHeaders: Record<string, string>
}

/**
 * Private HOSTS gist MCP install block (requires sign-in for header embedding).
 * @param props Section props
 * @returns Install UI for `/api/mcp`
 */
export function McpHostsInstallSection({ mcpUrl, mcpHeaders }: McpHostsInstallSectionProps) {
  const [jsonCopied, setJsonCopied] = useState(false)
  const [apiKeyCopied, setApiKeyCopied] = useState(false)
  const [secretsVisible, setSecretsVisible] = useState(false)

  const installJson = useMemo(() => buildCursorMcpJson(mcpUrl, MCP_INSTALL_SERVER_KEY, mcpHeaders), [mcpUrl, mcpHeaders])
  const previewHeaders = useMemo(() => (secretsVisible ? mcpHeaders : maskSensitiveMcpHeadersForDisplay(mcpHeaders)), [mcpHeaders, secretsVisible])
  const previewJson = useMemo(() => buildCursorMcpJson(mcpUrl, MCP_INSTALL_SERVER_KEY, previewHeaders), [mcpUrl, previewHeaders])
  const apiKeyEntry = useMemo(() => findApiKeyHeaderEntry(mcpHeaders), [mcpHeaders])
  const hasEmbeddableHeaders = Object.keys(mcpHeaders).length > 0

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(installJson)
      setJsonCopied(true)
      window.setTimeout(() => setJsonCopied(false), 1600)
    } catch {
      setJsonCopied(false)
    }
  }

  async function copyApiKey() {
    if (!apiKeyEntry) {
      return
    }
    try {
      await navigator.clipboard.writeText(apiKeyEntry[1])
      setApiKeyCopied(true)
      window.setTimeout(() => setApiKeyCopied(false), 1600)
    } catch {
      setApiKeyCopied(false)
    }
  }

  return (
    <div className="space-y-3 text-sm text-app-text">
      <h2 className="text-sm font-semibold text-app-text">Private HOSTS MCP</h2>
      <p className="text-xs leading-relaxed text-app-muted">
        Requires sign-in or <code className="rounded bg-app-subtle px-1 py-0.5 font-mono text-[11px]">x-api-key</code> on{' '}
        <code className="rounded bg-app-subtle px-1 py-0.5 font-mono text-[11px]">/api/mcp</code>. Tools:{' '}
        <code className="rounded bg-app-subtle px-1 py-0.5 font-mono text-[11px]">dns_hosts_read</code>,{' '}
        <code className="rounded bg-app-subtle px-1 py-0.5 font-mono text-[11px]">dns_hosts_write</code>,{' '}
        <code className="rounded bg-app-subtle px-1 py-0.5 font-mono text-[11px]">dns_hosts_add</code>,{' '}
        <code className="rounded bg-app-subtle px-1 py-0.5 font-mono text-[11px]">dns_hosts_remove</code>.
      </p>
      {apiKeyEntry ? (
        <div className="rounded-md border border-app-border bg-app-subtle px-3 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">x-api-key</span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSecretsVisible((visible) => !visible)}
                className={ghostBtnClass}
                aria-pressed={secretsVisible}
                aria-label={secretsVisible ? 'Hide API key' : 'Show API key'}
              >
                {secretsVisible ? <FiEyeOff size={13} aria-hidden /> : <FiEye size={13} aria-hidden />}
                {secretsVisible ? 'Hide' : 'Show'}
              </button>
              <button type="button" onClick={() => void copyApiKey()} className={ghostBtnClass}>
                {apiKeyCopied ? <FiCheck size={13} aria-hidden /> : <FiCopy size={13} aria-hidden />}
                Copy key
              </button>
            </div>
          </div>
          <p className="mt-2 break-all font-mono text-xs text-app-text">{secretsVisible ? apiKeyEntry[1] : MCP_SECRET_MASK}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-app-muted">Copy JSON and one-click install always use the full key (Cursor does not send browser cookies).</p>
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-app-muted">Manual config</label>
        <button type="button" onClick={() => void copyJson()} className={ghostBtnClass}>
          {jsonCopied ? <FiCheck size={13} aria-hidden /> : <FiCopy size={13} aria-hidden />}
          Copy JSON
        </button>
      </div>
      <pre className="w-full min-w-0 overflow-x-auto overflow-y-visible rounded-md border border-app-border bg-app-subtle p-3 text-xs leading-relaxed text-app-text sm:text-[13px]">
        <code className="block whitespace-pre font-mono">{previewJson}</code>
      </pre>
      {!hasEmbeddableHeaders ? (
        <p className="text-xs leading-relaxed text-app-muted">
          Set <code className="rounded bg-app-subtle px-1 py-0.5 font-mono text-[11px] text-app-text">DNS_MCP_HEADERS</code> on the server, or paste{' '}
          <code className="rounded bg-app-subtle px-1 py-0.5 font-mono text-[11px] text-app-text">x-api-key</code> into your editor config after install.
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
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
    </div>
  )
}

/**
 * Renders DNS Tester MCP install UI: public probe MCP always visible; HOSTS MCP after sign-in.
 * Auth headers load via `/api/mcp/headers` after sign-in (masked in UI; copy/install use plaintext).
 * @param requestOrigin Optional scheme+host from the server (see {@link McpInstallPanelProps.requestOrigin})
 * @returns Install card with public and optional private sections
 */
export function McpInstallPanel({ requestOrigin }: McpInstallPanelProps) {
  const fromServer = requestOrigin?.trim() ?? ''
  const [baseUrl, setBaseUrl] = useState(fromServer)

  const { data: session, loading: sessionLoading, error: sessionError } = useRequest(fetchDnsMcpInstallSession)

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
  const probeMcpUrl = baseUrl ? `${baseUrl}/api/mcp-dns` : '/api/mcp-dns'
  const loginHref = `/login?redirectUrl=${encodeURIComponent('/mcp')}`

  return (
    <section className="rounded-lg border border-app-border bg-app-surface p-5 shadow-sm sm:p-6" aria-label="MCP install">
      <McpProbeInstallSection probeMcpUrl={probeMcpUrl} />

      <div className="mt-8 border-t border-app-border pt-6">
        {sessionLoading ? (
          <McpInstallSkeleton />
        ) : sessionError ? (
          <div role="alert">
            <p className="rounded-lg border border-app-danger bg-app-dangerSoft px-4 py-3 text-sm text-app-danger">
              {sessionError.message || 'Failed to load MCP install headers'}
            </p>
          </div>
        ) : session?.signedIn ? (
          <McpHostsInstallSection mcpUrl={mcpUrl} mcpHeaders={session.headers} />
        ) : (
          <div className="space-y-2 text-sm text-app-text">
            <h2 className="text-sm font-semibold text-app-text">Private HOSTS MCP</h2>
            <p className="text-xs leading-relaxed text-app-muted">
              Sign in to generate install JSON with your session or configured <code className="rounded bg-app-subtle px-1 py-0.5 font-mono text-[11px]">x-api-key</code> for{' '}
              <code className="rounded bg-app-subtle px-1 py-0.5 font-mono text-[11px]">/api/mcp</code> (Gist HOSTS read/write tools).
            </p>
            <Link
              href={loginHref}
              className="inline-flex min-h-8 items-center rounded-md border border-app-accent bg-app-accent px-3 py-1 text-xs font-medium text-white transition-colors hover:opacity-90"
            >
              Sign in for HOSTS MCP
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
