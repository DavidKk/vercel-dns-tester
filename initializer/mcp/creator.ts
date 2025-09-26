import { NextResponse, type NextRequest } from 'next/server'
import { api } from '@/initializer/controller'
import type { ContextWithParams } from '@/initializer/controller'
import { mcpResponse, mcpErrorToolNotFound, mcpErrorinvalidArguments, mcpErrorMethodNotAllowed } from './response'
import type { Tool } from './tool'

/** MCP Tool interface */
export interface MCPManifestTool {
  /** Tool description */
  description?: string
  /** Input schema in JSON Schema format */
  inputSchema: any
  /** Output schema in JSON Schema format (optional) */
  outputSchema?: any
}

/** MCP Manifest interface */
export interface MCPManifest {
  /** Service name */
  name: string
  /** Service version */
  version: string
  /** Service description */
  description?: string
  /** Available tools */
  tools: Record<string, MCPManifestTool>
}

/**
 * Generate MCP manifest object
 * @param name Service name
 * @param version Service version
 * @param description Service description
 * @param tools Available tools
 * @returns MCP manifest object
 */
export function generateMCPManifest(name: string, version: string, description: string, toolsMap: Map<string, Tool>): MCPManifest {
  const tools = Object.fromEntries(
    (function* () {
      for (const [_, tool] of toolsMap) {
        const manifest: MCPManifestTool = {
          description: tool.description,
          inputSchema: tool.manifest.parameters,
        }

        yield [tool.name, manifest]
      }
    })()
  )

  return { name, version, description, tools }
}

/**
 * Higher-order function to wrap MCP request processing and integrate with api() function
 * @param handler The actual request handler function
 * @param allowedMethods Allowed HTTP methods, defaults to ['GET', 'POST']
 * @returns Wrapped handler function
 */
function withMCPHandler<P = any>(handler: (req: NextRequest, context: ContextWithParams<P>) => Promise<any>, allowedMethods: string[] = ['GET', 'POST']) {
  return api(async (req: NextRequest, context: ContextWithParams<P>) => {
    try {
      // Validate HTTP method
      const method = req.method || 'GET'
      if (!allowedMethods.includes(method)) {
        return mcpErrorMethodNotAllowed(`Method ${method} not allowed. Allowed methods: ${allowedMethods.join(', ')}`)
      }

      // For POST requests, validate Content-Type
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

/**
 * Create manifest handler
 * @param name Service name
 * @param version Service version
 * @param description Service description
 * @param tools Available tools
 * @returns Wrapped manifest handler function
 */
function createManifestHandler(name: string, version: string, description: string, tools: Map<string, Tool>) {
  return withMCPHandler(async () => {
    const manifest = generateMCPManifest(name, version, description, tools)
    return NextResponse.json({ type: 'result', result: manifest })
  }, ['GET'])
}

/**
 * Create tool execution handler
 * @param tools Available tools
 * @returns Wrapped tool execution handler function
 */
function createToolExecutionHandler(tools: Map<string, Tool>) {
  return withMCPHandler(
    async (req: NextRequest) => {
      const body = await req.json()
      const { tool: toolName, params = {} } = body

      if (!toolName) {
        return mcpErrorinvalidArguments('Missing tool name')
      }

      const tool = tools.get(toolName)
      if (!tool) {
        return mcpErrorToolNotFound(`Tool "${toolName}" not found`)
      }

      const validation = tool.validateParameters(params)
      if (validation !== true) {
        return mcpErrorinvalidArguments(validation)
      }

      const result = await tool.call(params)
      return mcpResponse(result)
    },
    ['POST']
  )
}

/**
 * Create MCP HTTP server, returning manifest and execute handler functions
 * @param name Service name
 * @param version Service version
 * @param description Service description
 * @param tools Available tools
 * @returns Object containing manifest and execute handler functions
 */
export function createMCPHttpServer(name: string, version: string, description: string, tools: Record<string, Tool> | Map<string, Tool>) {
  const toolsMap = tools instanceof Map ? tools : new Map(Object.entries(tools))
  const manifest = createManifestHandler(name, version, description, toolsMap)
  const execute = createToolExecutionHandler(toolsMap)
  return { manifest, execute }
}
