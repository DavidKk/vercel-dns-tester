interface McpError {
  [key: string]: {
    code: string
    message: string
  }
}

/** Stable MCP error codes for HTTP JSON error envelopes */
export const MCP_ERRORS = {
  INVALID_ARGUMENT: {
    code: 'INVALID_ARGUMENT',
    message: 'The provided arguments are invalid or missing required fields.',
  },
  TOOL_NOT_FOUND: {
    code: 'TOOL_NOT_FOUND',
    message: 'The requested tool does not exist or is not registered.',
  },
  METHOD_NOT_ALLOWED: {
    code: 'METHOD_NOT_ALLOWED',
    message: 'The request method is not allowed. Please use the correct HTTP method.',
  },
  TIMEOUT: {
    code: 'TIMEOUT',
    message: 'The tool execution exceeded the configured timeout.',
  },
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    message: 'An unexpected internal error occurred while processing the request.',
  },
} as const satisfies McpError
