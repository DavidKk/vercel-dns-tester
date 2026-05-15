/** JWT audience for Signet token verification (fixed for this app) */
const SIGNET_AUDIENCE = 'dns-tester'

interface SignetVerifyResult {
  ok: boolean
  status: number
  response: {
    data?: SignetVerifyData
    message?: string
  } | null
  error?: string
}

export interface SignetVerifyData {
  access_token?: string
  user?: {
    sub?: string
    username?: string
    preferred_username?: string
    email?: string
    authenticated?: boolean
  }
  claims?: Record<string, unknown>
}

interface SignetClientSdk {
  buildLoginUrl(options: { authCenterOrigin: string; redirectUrl: string; state?: string }): string
  parseLoginCallbackParams(input: URLSearchParams | string): { token: string | null; state: string | null }
  verifyTokenAtAuthCenter(options: { authCenterOrigin: string; token: string; audience?: string; scope?: string; fetch?: typeof fetch }): Promise<SignetVerifyResult>
}

let signetSdkPromise: Promise<SignetClientSdk> | null = null

/**
 * Strip trailing slashes from an origin URL
 * @param origin Origin string
 * @returns Normalized origin
 */
function normalizeOrigin(origin: string): string {
  return origin.replace(/\/+$/, '')
}

/**
 * Read configured Signet SDK URL from env
 * @returns Trimmed SDK URL or empty string when unset
 */
function getConfiguredSignetSdkUrl(): string {
  return process.env.SIGNET_SDK_URL?.trim() ?? ''
}

/**
 * Resolve Signet auth center origin from `SIGNET_SDK_URL`
 * @returns Normalized origin without trailing slash
 */
export function getSignetOrigin(): string {
  const sdkUrl = getConfiguredSignetSdkUrl()
  if (!sdkUrl) {
    throw new Error('SIGNET_SDK_URL is not configured')
  }

  try {
    return normalizeOrigin(new URL(sdkUrl).origin)
  } catch {
    throw new Error('SIGNET_SDK_URL is not a valid URL')
  }
}

/**
 * Resolve the hosted Signet SDK URL from `SIGNET_SDK_URL`
 * @returns Absolute SDK module URL
 */
export function getSignetSdkUrl(): string {
  const sdkUrl = getConfiguredSignetSdkUrl()
  if (!sdkUrl) {
    throw new Error('SIGNET_SDK_URL is not configured')
  }
  return sdkUrl
}

/**
 * Whether Signet login should be shown in UI (enabled when `SIGNET_SDK_URL` is set)
 * @returns True when Signet login is configured
 */
export function isSignetLoginEnabled(): boolean {
  return getConfiguredSignetSdkUrl().length > 0
}

/**
 * JWT audience passed to Signet token verification
 * @returns Audience string
 */
export function getSignetAudience(): string {
  return SIGNET_AUDIENCE
}

/**
 * Load the hosted Signet SDK in Node/Next Route Handlers
 * @returns Cached Signet SDK module
 */
export async function loadSignetSdk(): Promise<SignetClientSdk> {
  signetSdkPromise ??= fetch(getSignetSdkUrl(), { cache: 'force-cache' })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load Signet SDK: ${response.status}`)
      }
      return response.text()
    })
    .then((source) => import(/* webpackIgnore: true */ `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`) as Promise<SignetClientSdk>)

  return signetSdkPromise
}
