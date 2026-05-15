import { checkUnAccess } from '@/services/auth/access'
import { isSignetLoginEnabled } from '@/services/auth/signet-sdk'

import { LoginForm } from './Form'

interface LoginPageProps {
  searchParams: Promise<{ redirectUrl?: string }>
}

/**
 * Login page for project-local authentication and optional Signet SSO
 * @param props Login page props containing optional redirect target
 * @returns Login form page
 */
export default async function LoginPage(props: LoginPageProps) {
  const { searchParams } = props
  const { redirectUrl: url = '/' } = await searchParams
  const redirectUrl = decodeURIComponent(url)
  await checkUnAccess({ redirectUrl, isApiRouter: false })

  return <LoginForm enable2FA={Boolean(process.env.ACCESS_2FA_SECRET)} enableSignet={isSignetLoginEnabled()} redirectUrl={redirectUrl} />
}
