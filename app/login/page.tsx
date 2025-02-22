import { checkUnAccess } from '@/services/auth/access'
import LoginForm from './Form'

interface LoginPageProps {
  searchParams: Promise<{ redirectUrl: string }>
}

export default async function LoginPage(props: LoginPageProps) {
  const { searchParams } = props
  const { redirectUrl: url = '/' } = await searchParams
  const redirectUrl = decodeURIComponent(url)
  await checkUnAccess({ redirectUrl, isApiRouter: false })
  return <LoginForm enable2FA={!!process.env.ACCESS_2FA_SECRET} redirectUrl={redirectUrl} />
}
