import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { jsonUnauthorized } from '@/initializer/response'
import { authorizeDnsMcpIntegration } from '@/services/auth/mcpIntegrationAuth'

import { MCP_INSTALL_SERVER_KEY } from './installSnippets'

export const runtime = 'nodejs'

/**
 * GET /api/mcp — minimal MCP manifest stub until tools are wired (requires auth).
 * @param req Incoming request
 * @returns JSON manifest or 401
 */
export async function GET(req: NextRequest) {
  if (!(await authorizeDnsMcpIntegration(req))) {
    return jsonUnauthorized()
  }
  return NextResponse.json({
    name: MCP_INSTALL_SERVER_KEY,
    version: '0.0.0',
    description: 'DNS Tester custom HOSTS MCP (tools not yet implemented).',
  })
}

/**
 * POST /api/mcp — JSON-RPC stub until tools are wired (requires auth).
 * @param req Incoming request
 * @returns 501 Not Implemented or 401
 */
export async function POST(req: NextRequest) {
  if (!(await authorizeDnsMcpIntegration(req))) {
    return jsonUnauthorized()
  }
  return NextResponse.json({ error: 'MCP tools not yet implemented' }, { status: 501 })
}
