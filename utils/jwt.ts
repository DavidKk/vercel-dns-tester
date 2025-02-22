import jwt from 'jsonwebtoken'

export function generateToken(payload: object) {
  const { JWT_SECRET, JWT_EXPIRES_IN } = getJWTConfig()
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any })
}

export function verifyToken(token: string) {
  try {
    const { JWT_SECRET } = getJWTConfig()
    return jwt.verify(token, JWT_SECRET)
  } catch (err) {
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
