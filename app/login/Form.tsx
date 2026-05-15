'use client'

import { useRequest } from 'ahooks'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { FiCheck, FiEye, FiEyeOff, FiLock, FiShield, FiUser } from 'react-icons/fi'

import type { AlertImperativeHandler } from '@/components/Alert'
import Alert from '@/components/Alert'
import { Spinner } from '@/components/Spinner'
import { name } from '@/package.json'

export interface LoginFormProps {
  enable2FA?: boolean
  enableSignet?: boolean
  redirectUrl?: string
}

/**
 * Login form with optional 2FA, remember-me, and Signet third-party sign-in
 * @param props Login form settings
 * @returns Login form component
 */
export function LoginForm(props: Readonly<LoginFormProps>) {
  const { enable2FA = false, enableSignet = false, redirectUrl = '/' } = props
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [access2FAToken, setAccess2FAToken] = useState('')
  const [complete, setComplete] = useState(false)
  const alertRef = useRef<AlertImperativeHandler>(null)
  const prev2FACompletionRef = useRef(false)
  const router = useRouter()

  const displayTitle = useMemo(() => name.replace('vercel', '').split('-').join(' '), [])

  const { withIconLeft, passwordInput, plainField, checkboxLabel } = useMemo(() => {
    const base =
      'w-full rounded-md border border-app-border bg-app-surface py-2.5 text-base text-app-text shadow-sm placeholder:text-app-muted placeholder:tracking-normal transition-colors focus:border-app-accent focus:outline-none focus:ring-2 focus:ring-app-accent/20'
    return {
      withIconLeft: `${base} pl-10 pr-3.5`,
      passwordInput: `${base} pl-10 pr-10`,
      plainField: `${base} px-3.5`,
      checkboxLabel: 'flex w-full cursor-pointer select-none items-center gap-2 text-sm text-app-muted',
    }
  }, [])

  const { run: submit, loading: submitting } = useRequest(
    async () => {
      if (!username || !password) {
        throw new Error('Username and password are required')
      }

      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, token: access2FAToken, rememberMe }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok || result?.code !== 0) {
        throw new Error(result?.message ?? 'Invalid username or password')
      }
    },
    {
      manual: true,
      throttleWait: 1000,
      onSuccess: () => {
        setComplete(true)
        router.push(redirectUrl)
        router.refresh()
      },
      onError: (error: Error) => {
        alertRef.current?.show(error.message, { type: 'error' })
      },
    }
  )

  /**
   * Submit credentials when the user submits the form
   * @param event Form submit event
   */
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting || complete) {
      return
    }
    submit()
  }

  useEffect(() => {
    if (!enable2FA) {
      prev2FACompletionRef.current = false
      return
    }

    const isComplete = /^\d{6}$/.test(access2FAToken)
    const wasComplete = prev2FACompletionRef.current
    prev2FACompletionRef.current = isComplete

    if (!isComplete || wasComplete || complete || submitting || !username || !password) {
      return
    }

    submit()
  }, [access2FAToken, complete, enable2FA, password, submitting, submit, username])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const params = new URLSearchParams(window.location.search)
    const err = params.get('error')
    if (!err) {
      return
    }
    const message =
      err === 'signet_state'
        ? 'Signet login could not validate state. Please try again.'
        : err === 'signet_verify'
          ? 'Signet login verification failed. Check Signet configuration and try again.'
          : `Login error: ${err}`
    alertRef.current?.show(message, { type: 'error' })
    params.delete('error')
    const qs = params.toString()
    const path = qs ? `${window.location.pathname}?${qs}` : window.location.pathname
    window.history.replaceState(null, '', path)
  }, [])

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto bg-app-subtle px-4 py-10 text-app-text">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-lg border border-app-border bg-app-surface p-6 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Image src="/favicon/favicon-96x96.png" alt="" width={56} height={56} className="h-14 w-14 rounded-md shadow-sm" priority />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-app-text">{displayTitle}</h1>
            <p className="mt-1 text-sm text-app-muted">Sign in to continue</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="relative w-full">
            <FiUser className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-muted" aria-hidden />
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Username"
              required
              autoComplete="username"
              className={withIconLeft}
            />
          </div>

          <div className="relative w-full">
            <FiLock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-muted" aria-hidden />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              required
              autoComplete="current-password"
              className={passwordInput}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-app-muted transition hover:bg-app-accentSoft hover:text-app-accent"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
            </button>
          </div>

          {enable2FA ? (
            <input
              className={`${plainField} text-center text-lg tracking-[0.35em]`}
              value={access2FAToken}
              onChange={(event) => setAccess2FAToken(event.target.value)}
              placeholder="2FA code"
              maxLength={6}
              pattern="[0-9]{6}"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
            />
          ) : null}

          <label className={checkboxLabel}>
            <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
              <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} className="peer sr-only" />
              <span className="absolute inset-0 rounded border border-app-border bg-app-surface transition-colors peer-checked:border-app-accent peer-checked:bg-app-accent" />
              <FiCheck className="relative h-3.5 w-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100" aria-hidden />
            </span>
            <span>Remember me</span>
          </label>

          <button
            disabled={submitting || complete}
            type="submit"
            className="flex w-full items-center justify-center rounded-md bg-app-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-app-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <span className="inline-flex items-center justify-center gap-2" aria-live="polite">
                <Spinner />
                <span>Signing in...</span>
              </span>
            ) : complete ? (
              <span>Redirecting...</span>
            ) : (
              <span>Sign in</span>
            )}
          </button>

          {enableSignet ? (
            <div className="flex flex-col gap-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden>
                  <div className="w-full border-t border-app-border" />
                </div>
                <div className="relative flex justify-center text-xs font-medium uppercase tracking-wide text-app-muted">
                  <span className="bg-app-surface px-3">Or continue with</span>
                </div>
              </div>
              <a
                href={`/api/auth/signet/start?redirectUrl=${encodeURIComponent(redirectUrl)}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-app-border bg-app-subtle px-4 py-2.5 text-sm font-semibold text-app-text shadow-sm transition hover:border-app-accent/40 hover:bg-app-accentSoft hover:text-app-accent"
              >
                <FiShield className="h-5 w-5 shrink-0 text-app-accent" aria-hidden />
                <span>Sign in with Signet</span>
              </a>
            </div>
          ) : null}

          <Alert ref={alertRef} />
        </div>
      </form>
    </div>
  )
}
