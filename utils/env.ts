import { headers } from 'next/headers'

export async function isApiRouter() {
  try {
    await headers()
    return true
  } catch (error) {
    return false
  }
}
