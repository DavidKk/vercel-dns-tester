import { type JWTPayload, jwtVerify, SignJWT } from 'jose'

export async function generateToken(payload: object): Promise<string> {
  const { secretKey, JWT_EXPIRES_IN } = getJWTConfigWithKey()
  const expiresIn = /^\d+$/.test(JWT_EXPIRES_IN) ? Number(JWT_EXPIRES_IN) : JWT_EXPIRES_IN

  return new SignJWT({ ...(payload as Record<string, unknown>) }).setProtectedHeader({ alg: 'HS256', typ: 'JWT' }).setExpirationTime(expiresIn).sign(secretKey)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const secretKey = getJWTSecretKey()
    const { payload } = await jwtVerify(token, secretKey)
    return payload
  } catch {
    return null
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
