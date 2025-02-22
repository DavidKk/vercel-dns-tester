import type { NextRequest } from 'next/server'

export interface Context {
  headers: Headers
  req: NextRequest
}

const storage = new AsyncLocalStorage<Context>()

export function runWithContext<T>(req: NextRequest, fn: () => T): T {
  return storage.run(createContext(req), fn)
}

export function createContext(req: NextRequest): Context {
  const headers = new Headers()
  return { req, headers }
}

export function getContext() {
  return storage.getStore()
}

type TrimFirst<T extends any[]> = T extends [any, ...infer B] ? B : never

export function withContext<T extends (ctx: Context, ...args: any[]) => any>(fn: T) {
  return (...args: TrimFirst<Parameters<T>>): ReturnType<T> | undefined => {
    if (typeof window !== 'undefined') {
      return
    }

    const context = getContext()
    if (!context) {
      return
    }

    return fn(context, ...args)
  }
}

export const getReqHeaders = withContext((ctx) => ctx.req.headers)

export const getHeaders = withContext((ctx) => ctx.headers)

export const setHeaders = withContext((ctx, headers: Headers | Record<string, string>) => {
  for (const [key, value] of Object.entries(headers)) {
    ctx.headers.set(key, value)
  }
})
