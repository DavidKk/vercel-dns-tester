import type { NextRequest } from 'next/server'

import { execute, manifest } from './dnsProbeMcpServer'

export const runtime = 'nodejs'

/**
 * GET /api/mcp-dns — MCP manifest for public DNS probe tools (no authentication).
 * @param req Incoming request
 * @param context Next.js route context
 * @returns JSON manifest
 */
export async function GET(req: NextRequest, context: { params: Promise<Record<string, string>> }) {
  return manifest(req, context)
}

/**
 * POST /api/mcp-dns — JSON-RPC 2.0 or legacy `{ tool, params }` for DNS probe tools (no authentication).
 * @param req Incoming request
 * @param context Next.js route context
 * @returns JSON-RPC or REST-shaped response
 */
export async function POST(req: NextRequest, context: { params: Promise<Record<string, string>> }) {
  return execute(req, context)
}
