import { NextResponse } from 'next/server'

import { MCP_ERRORS } from './errors'

export type MCPResponseType = 'result' | 'error'

export interface MCPResponseError {
  code: string
  message: string
  detail?: any
}

export type MCPResponse<T> = NextResponse<{
  type: MCPResponseType
  error?: MCPResponseError
  result?: T
}>

export function mcpResponse<T>(result?: T): MCPResponse<T> {
  return NextResponse.json({ type: 'result', result })
}

export function mcpError(error: MCPResponseError): MCPResponse<any> {
  return NextResponse.json({ type: 'error', error })
}

export function mcpErrorinvalidArguments(message?: string): MCPResponse<any> {
  return mcpError({ ...MCP_ERRORS.INVALID_ARGUMENT, ...(message && { message }) })
}

export function mcpErrorToolNotFound(message?: string): MCPResponse<any> {
  return mcpError({ ...MCP_ERRORS.TOOL_NOT_FOUND, ...(message && { message }) })
}

export function mcpErrorMethodNotAllowed(message?: string): MCPResponse<any> {
  return mcpError({ ...MCP_ERRORS.METHOD_NOT_ALLOWED, ...(message && { message }) })
}
