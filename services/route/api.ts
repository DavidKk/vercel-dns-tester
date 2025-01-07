import { stringifyUnknownError } from '@/utils/response'
import { NextRequest, NextResponse } from 'next/server'

export function api(handle: (req: NextRequest) => any) {
  return async (req: NextRequest) => {
    try {
      const result = await handle(req)
      return NextResponse.json(result)
    } catch (error) {
      const message = stringifyUnknownError(error)
      return NextResponse.json(message, { status: 500 })
    }
  }
}
