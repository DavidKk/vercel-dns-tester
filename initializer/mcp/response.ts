import { NextResponse } from 'next/server'

import { MCP_ERRORS } from './errors'

/** Do not cache MCP or tool responses at shared caches */
const CACHE_CONTROL_NO_STORE = 'private, no-store'

/**
 * Ensure MCP responses are not stored at shared caches.
 * @param res NextResponse from this module or creator
 * @returns Same response with Cache-Control set
 */
export function applyNoStoreCache<T>(res: NextResponse<T>): NextResponse<T> {
  res.headers.set('Cache-Control', CACHE_CONTROL_NO_STORE)
  return res
}

export type MCPResponseType = 'result' | 'error'

export interface MCPResponseError {
  code: string
  message: string
  detail?: unknown
}

export type MCPResponse<T> = NextResponse<{
  type: MCPResponseType
  error?: MCPResponseError
  result?: T
}>

/**
 * Build a legacy MCP success envelope.
 * @param result Optional payload
 * @returns JSON response with type result
 */
export function mcpResponse<T>(result?: T): MCPResponse<T> {
  return applyNoStoreCache(NextResponse.json({ type: 'result', result }))
}

/**
 * Build a legacy MCP error envelope.
 * @param error Error descriptor
 * @returns JSON response with type error
 */
export function mcpError(error: MCPResponseError): MCPResponse<unknown> {
  return applyNoStoreCache(NextResponse.json({ type: 'error', error }))
}

/**
 * Build invalid-argument error response.
 * @param message Optional override message
 * @returns MCP error response
 */
export function mcpErrorinvalidArguments(message?: string): MCPResponse<unknown> {
  return mcpError({ ...MCP_ERRORS.INVALID_ARGUMENT, ...(message && { message }) })
}

/**
 * Build tool-not-found error response.
 * @param message Optional override message
 * @returns MCP error response
 */
export function mcpErrorToolNotFound(message?: string): MCPResponse<unknown> {
  return mcpError({ ...MCP_ERRORS.TOOL_NOT_FOUND, ...(message && { message }) })
}

/**
 * Build method-not-allowed error response.
 * @param message Optional override message
 * @returns MCP error response
 */
export function mcpErrorMethodNotAllowed(message?: string): MCPResponse<unknown> {
  return mcpError({ ...MCP_ERRORS.METHOD_NOT_ALLOWED, ...(message && { message }) })
}

/** JSON-RPC 2.0 standard error codes */
export const JSONRPC = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
} as const

/**
 * Build a JSON-RPC 2.0 success response
 * @param id Request id (string or number)
 * @param result Result payload
 * @returns NextResponse JSON body
 */
export function jsonRpcSuccess(id: string | number | null, result: unknown) {
  return applyNoStoreCache(NextResponse.json({ jsonrpc: '2.0', id, result }))
}

/**
 * Build a JSON-RPC 2.0 error response
 * @param id Request id (string or number or null)
 * @param code JSON-RPC 2.0 numeric code
 * @param message Human-readable message
 * @returns NextResponse JSON body
 */
export function jsonRpcError(id: string | number | null, code: number, message: string) {
  return applyNoStoreCache(NextResponse.json({ jsonrpc: '2.0', id, error: { code, message } }))
}
