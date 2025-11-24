import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'

import type { Context } from '@/initializer/controller'
import { jsonUnauthorized } from '@/initializer/response'
import { validateCookie } from '@/services/auth/access'

export interface AuthContext extends Context {
  $$authorized?: boolean
}

export function withAuthHandler<C extends Context>(handle: (req: NextRequest, context: C & AuthContext) => Promise<any>) {
  return async (req: NextRequest, context: C & AuthContext) => {
    if (!(await validateCookie())) {
      return jsonUnauthorized()
    }

    return handle(req, context)
  }
}

interface Action<A extends any[], R> {
  (...args: A): Promise<R>
  $$: (...args: A) => Promise<R>
}

export function withAuthAction<A extends any[], R>(request: (...args: A) => Promise<R>): Action<A, R> {
  const action = async (...args: A): Promise<R> => {
    if (!(await validateCookie())) {
      redirect('/login')
    }

    return request(...args)
  }

  action.$$ = request
  return action
}

/**
 * Trim action handler to return only the action function
 */
export function trimAction<A extends any[], R>(action: Action<A, R>) {
  return action.$$
}
