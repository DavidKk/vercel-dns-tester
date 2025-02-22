import { NextResponse } from 'next/server'

export interface StandardResponse {
  code: number
  message: string
  data: any
}

export interface StandardResponseInit {
  code?: number
  message?: string
  data?: any
}

export interface StandardResponseEnhancer extends StandardResponse {
  toJsonResponse: (this: StandardResponse, status: number, options?: ResponseInit) => NextResponse<StandardResponse>
  toTextResponse: (this: StandardResponse, status: number, options?: ResponseInit) => NextResponse<string>
}

export function standardResponse(init?: StandardResponseInit) {
  const { code = 0, message = 'ok', data = null } = init || {}

  return Object.defineProperties<StandardResponseEnhancer>({ code, message, data } as any, {
    toJsonResponse: {
      enumerable: false,
      configurable: false,
      value(status: number, options: ResponseInit = {}) {
        const { code, message, data } = this

        return NextResponse.json(
          { code, message, data },
          {
            status,
            ...options,
          }
        )
      },
    },
    toTextResponse: {
      enumerable: false,
      configurable: false,
      value(status: number, options: ResponseInit = {}) {
        const { message } = this
        return new NextResponse(message, { status, ...options })
      },
    },
  })
}

export function isStandardResponse(data: any): data is StandardResponse {
  return data && typeof data === 'object' && typeof data.code === 'number' && typeof data.message === 'string'
}

export function standardResponseSuccess(data?: any): StandardResponse {
  return standardResponse({ code: 0, message: 'ok', data })
}

export function standardResponseError(message: string, init?: Omit<StandardResponseInit, 'message'>) {
  const { code = 1, data = null } = init || {}
  return standardResponse({ code, message, data })
}

export interface ResponseInit {
  status?: number
  headers?: Headers
}

export function json(data: StandardResponse, options: ResponseInit = {}) {
  return NextResponse.json(data, { status: 200, ...options })
}

export function jsonSuccess(data?: any, options: ResponseInit = {}) {
  const response = standardResponseSuccess(data)
  return json(response, { status: 200, ...options })
}

export function stringifyUnknownError(error: unknown) {
  if (isStandardResponse(error)) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return JSON.stringify(error)
}

export interface ErrorResponseInit extends ResponseInit {
  code?: number
}

export function invalidParameters(message = 'invalid parameters') {
  return standardResponseError(message, { code: 1000 })
}

export function unauthorized(message = 'unauthorized') {
  return standardResponseError(message, { code: 2000 })
}

export function textInvalidParameters(message: string, options: ResponseInit = {}) {
  return invalidParameters(message).toTextResponse(400, options)
}

export function textUnauthorized(message = 'unauthorized', options: ResponseInit = {}) {
  return unauthorized(message).toTextResponse(401, options)
}

export function jsonInvalidParameters(message: string, options: ErrorResponseInit = {}) {
  return invalidParameters(message).toJsonResponse(400, options)
}

export function jsonUnauthorized(message = 'unauthorized', options: ErrorResponseInit = {}) {
  return unauthorized(message).toJsonResponse(401, options)
}
