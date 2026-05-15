import { type NextRequest, NextResponse } from 'next/server'

import type { ContextWithParams } from '@/initializer/controller'
import { api } from '@/initializer/controller'

import { MCP_ERRORS } from './errors'
import {
  applyNoStoreCache,
  JSONRPC,
  jsonRpcError,
  jsonRpcSuccess,
  mcpError,
  mcpErrorinvalidArguments,
  mcpErrorMethodNotAllowed,
  mcpErrorToolNotFound,
  mcpResponse,
} from './response'
import type { Tool } from './tool'

const MIN_TOOL_CALL_TIMEOUT_MS = 3_000
const MAX_TOOL_CALL_TIMEOUT_MS = 24_000
const DEFAULT_TOOL_CALL_TIMEOUT_MS = 20_000

/** MCP manifest tool entry */
export interface MCPManifestTool {
  description?: string
  inputSchema: unknown
  outputSchema?: unknown
}

/** MCP resource descriptor (manifest and JSON-RPC resources/list). */
export interface MCPManifestResource {
  uri: string
  name: string
  description?: string
  mimeType?: string
}

/** Optional MCP resources provider (for skill markdown and other docs). */
export interface McpResourceProvider {
  listResources: () => MCPManifestResource[]
  readResource: (uri: string) => Promise<{ mimeType: string; text: string } | null>
}

/** MCP manifest returned by GET manifest route */
export interface MCPManifest {
  name: string
  version: string
  description?: string
  tools: Record<string, MCPManifestTool>
  resources?: MCPManifestResource[]
}

/**
 * Generate MCP manifest object from registered tools.
 * @param name Service name
 * @param version Service version
 * @param description Service description
 * @param toolsMap Tools keyed by name
 * @param resourceProvider Optional resources provider
 * @returns Serializable manifest
 */
export function generateMCPManifest(name: string, version: string, description: string, toolsMap: Map<string, Tool>, resourceProvider?: McpResourceProvider | null): MCPManifest {
  const tools = Object.fromEntries(
    (function* () {
      for (const [, t] of toolsMap) {
        const manifest: MCPManifestTool = {
          description: t.description,
          inputSchema: t.manifest.parameters,
        }
        yield [t.name, manifest]
      }
    })()
  )

  const manifest: MCPManifest = { name, version, description, tools }
  if (resourceProvider) {
    manifest.resources = resourceProvider.listResources()
  }
  return manifest
}

/**
 * Wrap MCP request processing with method and JSON checks.
 * @param handler Inner handler
 * @param allowedMethods Allowed HTTP methods
 * @returns Next.js route handler
 */
function withMCPHandler<P = unknown>(
  handler: (req: NextRequest, context: ContextWithParams<P>) => Promise<NextResponse | Record<string, unknown>>,
  allowedMethods: string[] = ['GET', 'POST']
) {
  return api(async (req: NextRequest, context: ContextWithParams<P>) => {
    try {
      const method = req.method || 'GET'
      if (!allowedMethods.includes(method)) {
        return mcpErrorMethodNotAllowed(`Method ${method} not allowed. Allowed methods: ${allowedMethods.join(', ')}`)
      }

      if (method === 'POST') {
        const contentType = req.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          return mcpErrorinvalidArguments('Content-Type must be application/json for POST requests')
        }
      }

      return await handler(req, context)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return mcpErrorinvalidArguments(message)
    }
  })
}

function createManifestHandler(name: string, version: string, description: string, tools: Map<string, Tool>, resourceProvider?: McpResourceProvider | null) {
  return withMCPHandler(async () => {
    const manifest = generateMCPManifest(name, version, description, tools, resourceProvider)
    return applyNoStoreCache(NextResponse.json({ type: 'result', result: manifest }))
  }, ['GET'])
}

function buildMCPToolsList(tools: Map<string, Tool>): { name: string; description?: string; inputSchema: unknown }[] {
  return Array.from(tools.entries()).map(([, t]) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.manifest.parameters,
  }))
}

/**
 * Resolve MCP tool-call timeout from env with safe bounds (same policy as unbnd OpenAPI MCP).
 * @returns Timeout in milliseconds
 */
function getMcpToolCallTimeoutMs(): number {
  const raw = process.env.MCP_TOOL_CALL_TIMEOUT_MS?.trim()
  if (!raw) {
    return DEFAULT_TOOL_CALL_TIMEOUT_MS
  }
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n)) {
    return DEFAULT_TOOL_CALL_TIMEOUT_MS
  }
  return Math.min(MAX_TOOL_CALL_TIMEOUT_MS, Math.max(MIN_TOOL_CALL_TIMEOUT_MS, n))
}

/**
 * Execute a tool with bounded wall time so HTTP handlers return before platform hard timeout.
 * Clears the timer when the tool finishes first to avoid orphaned timers.
 * @param toolName Tool name for error context
 * @param run Tool execution function
 * @returns Tool result when finished within timeout
 */
async function callToolWithTimeout<T>(toolName: string, run: () => Promise<T>): Promise<T> {
  const timeoutMs = getMcpToolCallTimeoutMs()
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      run(),
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`tool "${toolName}" timed out after ${timeoutMs}ms`))
        }, timeoutMs)
      }),
    ])
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer)
    }
  }
}

async function handleJsonRpcRequest(
  body: { id?: string | number | null; method?: string; params?: unknown },
  tools: Map<string, Tool>,
  service: { name: string; version: string; description?: string },
  resourceProvider?: McpResourceProvider | null
): Promise<NextResponse> {
  const id = body.id ?? null

  if (typeof body.method === 'string' && body.method.startsWith('notifications/')) {
    return applyNoStoreCache(new NextResponse(null, { status: 200 }))
  }

  if (body.method === 'ping') {
    return jsonRpcSuccess(id, {})
  }

  if (body.method === 'initialize') {
    const protocolVersion = (body.params && (body.params as { protocolVersion?: string }).protocolVersion) || '2025-06-18'
    const capabilities: Record<string, unknown> = {
      tools: {
        listChanged: false,
      },
    }
    if (resourceProvider) {
      capabilities.resources = {
        subscribe: false,
        listChanged: false,
      }
    }
    return jsonRpcSuccess(id, {
      protocolVersion,
      capabilities,
      serverInfo: {
        name: service.name,
        version: service.version,
        description: service.description,
      },
    })
  }

  if (body.method === 'tools/list') {
    const toolsList = buildMCPToolsList(tools)
    return jsonRpcSuccess(id, { tools: toolsList })
  }

  if (body.method === 'resources/list') {
    if (!resourceProvider) {
      return jsonRpcError(id, JSONRPC.METHOD_NOT_FOUND, 'resources/list not supported for this MCP endpoint')
    }
    return jsonRpcSuccess(id, { resources: resourceProvider.listResources() })
  }

  if (body.method === 'resources/read') {
    if (!resourceProvider) {
      return jsonRpcError(id, JSONRPC.METHOD_NOT_FOUND, 'resources/read not supported for this MCP endpoint')
    }
    const uri = (body.params as { uri?: unknown } | undefined)?.uri
    if (!uri || typeof uri !== 'string') {
      return jsonRpcError(id, JSONRPC.INVALID_PARAMS, 'Missing or invalid "params.uri" for resources/read')
    }
    let content: Awaited<ReturnType<McpResourceProvider['readResource']>>
    try {
      content = await resourceProvider.readResource(uri.trim())
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return jsonRpcError(id, JSONRPC.INTERNAL_ERROR, `Failed to read resource: ${message}`)
    }
    if (!content) {
      return jsonRpcError(id, JSONRPC.INVALID_PARAMS, `Unknown resource URI: ${uri}`)
    }
    return jsonRpcSuccess(id, {
      contents: [{ uri: uri.trim(), mimeType: content.mimeType, text: content.text }],
    })
  }

  if (body.method === 'tools/call') {
    const params = (body.params ?? {}) as { name?: string; arguments?: Record<string, unknown> }
    const toolName = params.name
    const args = params.arguments ?? {}
    if (!toolName || typeof toolName !== 'string') {
      return jsonRpcError(id, JSONRPC.INVALID_PARAMS, 'Missing or invalid "params.name"')
    }

    const toolEntry = tools.get(toolName)
    if (!toolEntry) {
      return jsonRpcError(id, JSONRPC.INVALID_PARAMS, `Unknown tool: ${toolName}`)
    }

    const validation = toolEntry.validateParameters(args)
    if (validation !== true) {
      return jsonRpcError(id, JSONRPC.INVALID_PARAMS, String(validation))
    }

    try {
      const result = await callToolWithTimeout(toolName, () => toolEntry.call(args))
      const content = [{ type: 'text' as const, text: JSON.stringify(result) }]
      return jsonRpcSuccess(id, { content, isError: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return jsonRpcSuccess(id, {
        content: [{ type: 'text' as const, text: message }],
        isError: true,
      })
    }
  }

  return jsonRpcError(id, JSONRPC.METHOD_NOT_FOUND, `Method not found: ${body.method ?? 'undefined'}`)
}

/**
 * Create tool execution handler. POST body can be:
 * - JSON-RPC 2.0: `{ jsonrpc: "2.0", id, method, params? }` → JSON-RPC response (same shape as vercel-openapi unbnd MCP)
 * - Legacy REST: `{ tool: string, params?: object }` → `{ type: "result", result }` or `{ type: "error", error }`
 */
function createToolExecutionHandler(name: string, version: string, description: string, tools: Map<string, Tool>, resourceProvider?: McpResourceProvider | null) {
  return withMCPHandler(
    async (req: NextRequest) => {
      const body = await req.json().catch(() => null)
      if (body == null || typeof body !== 'object') {
        return mcpErrorinvalidArguments('Invalid JSON body')
      }

      const isJsonRpc = (body as { jsonrpc?: string; method?: string }).jsonrpc === '2.0' && typeof (body as { method?: string }).method === 'string'
      if (isJsonRpc) {
        return handleJsonRpcRequest(
          body as { id?: string | number | null; method?: string; params?: unknown },
          tools,
          {
            name,
            version,
            description,
          },
          resourceProvider
        )
      }

      const { tool: toolName, params = {} } = body as { tool?: string; params?: Record<string, unknown> }
      if (!toolName) {
        return mcpErrorinvalidArguments('Missing tool name')
      }

      const toolEntry = tools.get(toolName)
      if (!toolEntry) {
        return mcpErrorToolNotFound(`Tool "${toolName}" not found`)
      }

      const validation = toolEntry.validateParameters(params)
      if (validation !== true) {
        return mcpErrorinvalidArguments(validation)
      }

      try {
        const result = await callToolWithTimeout(toolName, () => toolEntry.call(params))
        return mcpResponse(result)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        if (message.includes('timed out after')) {
          return mcpError({ ...MCP_ERRORS.TIMEOUT, message })
        }
        return mcpErrorinvalidArguments(message)
      }
    },
    ['POST']
  )
}

/**
 * Create MCP HTTP handlers (manifest GET, execute POST) for a tool map.
 * @param name Service name
 * @param version Service version
 * @param description Service description
 * @param tools Tool map or plain record
 * @param resourceProvider Optional resource provider for skill/doc resources
 * @returns Route handlers for manifest and execute
 */
export function createMCPHttpServer(
  name: string,
  version: string,
  description: string,
  tools: Record<string, Tool> | Map<string, Tool>,
  resourceProvider?: McpResourceProvider | null
) {
  const toolsMap = tools instanceof Map ? tools : new Map(Object.entries(tools))
  const manifest = createManifestHandler(name, version, description, toolsMap, resourceProvider)
  const execute = createToolExecutionHandler(name, version, description, toolsMap, resourceProvider)
  return { manifest, execute }
}
