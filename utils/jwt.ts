import { type JWTPayload, jwtVerify, SignJWT } from 'jose'

/**
 * Generate a signed JWT with the given payload
 * @param payload Claims to embed in the token
 * @param expiresIn Optional expiration override (e.g. 7d)
 * @returns Signed JWT string
 */
export async function generateToken(payload: object, expiresIn?: string): Promise<string> {
  const { secretKey, JWT_EXPIRES_IN } = getJWTConfigWithKey()
  const expiration = expiresIn ?? JWT_EXPIRES_IN
  const resolvedExpiresIn = /^\d+$/.test(expiration) ? Number(expiration) : expiration

  return new SignJWT({ ...(payload as Record<string, unknown>) }).setProtectedHeader({ alg: 'HS256', typ: 'JWT' }).setExpirationTime(resolvedExpiresIn).sign(secretKey)
}

/**
 * Verify a JWT and return its payload, or null if invalid/expired
 * @param token JWT string to verify
 * @returns Decoded payload or null
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const secretKey = getJWTSecretKey()
    const { payload } = await jwtVerify(token, secretKey)
    return payload
  } catch {
    return null
  }
}

/**
 * Resolves JWT expiry for interactive password login
 * @param rememberMe When true, uses JWT_EXPIRES_IN from env; when false, forces one day
 * @returns Duration string passed to generateToken
 */
export function getLoginJwtExpiresIn(rememberMe: boolean): string {
  const { JWT_EXPIRES_IN } = getJWTConfig()
  return rememberMe ? JWT_EXPIRES_IN : '1d'
}

/**
 * Approximate cookie Max-Age seconds from a simple duration string
 * @param expiresIn Value such as 7d or 12h
 * @returns Non-negative seconds suitable for Set-Cookie Max-Age
 */
export function jwtExpiresInToMaxAgeSeconds(expiresIn: string): number {
  const m = /^(\d+)\s*([dhms])$/i.exec(expiresIn.trim())
  if (!m) {
    return 86400
  }
  const amount = parseInt(m[1], 10)
  const unit = m[2].toLowerCase()
  switch (unit) {
    case 'd':
      return amount * 86400
    case 'h':
      return amount * 3600
    case 'm':
      return amount * 60
    case 's':
      return amount
    default:
      return 86400
  }
}

function getJWTConfig() {
  const JWT_SECRET = process.env.JWT_SECRET
  const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d'

  if (!JWT_SECRET) {
    throw new Error('process.env.JWT_SECRET is not defined')
  }

  return {
    JWT_SECRET,
    JWT_EXPIRES_IN,
  }
}

function getJWTSecretKey(): Uint8Array {
  const { JWT_SECRET } = getJWTConfig()
  return new TextEncoder().encode(JWT_SECRET)
}

function getJWTConfigWithKey(): { secretKey: Uint8Array; JWT_EXPIRES_IN: string } {
  const { JWT_SECRET, JWT_EXPIRES_IN } = getJWTConfig()
  const secretKey = new TextEncoder().encode(JWT_SECRET)

  return {
    secretKey,
    JWT_EXPIRES_IN,
  }
}
