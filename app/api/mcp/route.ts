import type { NextRequest } from 'next/server'

import { jsonUnauthorized } from '@/initializer/response'
import { authorizeDnsMcpIntegration } from '@/services/auth/mcpIntegrationAuth'

import { execute, manifest } from './dnsHostsMcpServer'

export const runtime = 'nodejs'

/**
 * GET /api/mcp — MCP manifest (tools list schema) for the DNS Tester HOSTS gist integration.
 * @param req Incoming request
 * @param context Next.js route context
 * @returns JSON manifest or 401
 */
export async function GET(req: NextRequest, context: { params: Promise<Record<string, string>> }) {
  if (!(await authorizeDnsMcpIntegration(req))) {
    return jsonUnauthorized()
  }
  return manifest(req, context)
}

/**
 * POST /api/mcp — JSON-RPC 2.0 (`initialize`, `tools/list`, `tools/call`) or legacy `{ tool, params }`.
 * @param req Incoming request
 * @param context Next.js route context
 * @returns JSON-RPC or REST-shaped response or 401
 */
export async function POST(req: NextRequest, context: { params: Promise<Record<string, string>> }) {
  if (!(await authorizeDnsMcpIntegration(req))) {
    return jsonUnauthorized()
  }
  return execute(req, context)
}
