import { authenticator } from 'otplib'

export interface Verify2faParams {
  token: string
  secret: string
}

export async function verify2fa(params: Verify2faParams) {
  const { token, secret } = params

  try {
    const isValid = authenticator.check(token, secret)
    return isValid
  } catch (error) {
    return false
  }
}
