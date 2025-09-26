interface McpError {
  [key: string]: {
    code: string
    message: string
  }
}

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
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    message: 'The request is not authorized to use this tool.',
  },
  FORBIDDEN: {
    code: 'FORBIDDEN',
    message: 'You do not have permission to access this tool.',
  },
  TIMEOUT: {
    code: 'TIMEOUT',
    message: 'The request timed out while waiting for a response.',
  },
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    message: 'An unexpected internal error occurred while processing the request.',
  },
  DEPENDENCY_ERROR: {
    code: 'DEPENDENCY_ERROR',
    message: 'A required external service or dependency failed.',
  },
  RATE_LIMITED: {
    code: 'RATE_LIMITED',
    message: 'Too many requests have been made. Please try again later.',
  },
  NOT_IMPLEMENTED: {
    code: 'NOT_IMPLEMENTED',
    message: 'This tool is not yet implemented or supported.',
  },
  BAD_RESPONSE: {
    code: 'BAD_RESPONSE',
    message: 'The tool returned an invalid or unexpected response.',
  },
} as const satisfies McpError
