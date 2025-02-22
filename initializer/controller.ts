import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getHeaders, runWithContext } from '@/services/context'
import { isStandardResponse, standardResponseError, stringifyUnknownError } from './response'

export interface Context {
  params: Promise<any>
  searchParams: URLSearchParams
}

export interface ContextWithParams<P> extends Context {
  params: Promise<P>
}

export function api(handle: (req: NextRequest, context: Context) => Promise<Record<string, any>>) {
  return async (req: NextRequest, context: Context) => {
    return runWithContext(req, async () => {
      try {
        const result = await handle(req, context)
        if (result instanceof NextResponse) {
          return result
        }

        const status = 'status' in result ? result.status : 200
        const inputHeaders = 'headers' in result ? result.headers : {}
        const collectHeaders = getHeaders()
        const headers = { ...collectHeaders, ...inputHeaders }
        return NextResponse.json(result, { status, headers })
      } catch (error) {
        if (error instanceof NextResponse) {
          return error
        }

        const result = (() => {
          if (isStandardResponse(error)) {
            return error
          }

          const message = stringifyUnknownError(error)
          return standardResponseError(message)
        })()

        return NextResponse.json(result, { status: 500 })
      }
    })
  }
}

export function plainText<P>(handle: (req: NextRequest, context: ContextWithParams<P>) => Promise<string | NextResponse>) {
  return async (req: NextRequest, context: ContextWithParams<P>) => {
    return runWithContext(req, async () => {
      try {
        const result = await handle(req, context)
        const headers = getHeaders()
        if (result instanceof NextResponse) {
          return result
        }

        return new NextResponse(result, { status: 200, headers })
      } catch (error) {
        const message = stringifyUnknownError(error)
        return new NextResponse(message, { status: 500 })
      }
    })
  }
}

export function buffer<P>(handle: (req: NextRequest, context: ContextWithParams<P>) => Promise<ArrayBuffer | NextResponse>) {
  return async (req: NextRequest, context: ContextWithParams<P>) => {
    return runWithContext(req, async () => {
      try {
        const result = await handle(req, context)
        const headers = getHeaders()
        if (result instanceof NextResponse) {
          return result
        }
        return new NextResponse(result, { status: 200, headers })
      } catch (error) {
        const message = stringifyUnknownError(error)
        return new NextResponse(message, { status: 500 })
      }
    })
  }
}
