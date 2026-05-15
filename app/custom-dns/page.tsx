import { checkAccess } from '@/services/auth/access'

import { CustomDNSPage } from './CustomDNSPage'

/**
 * Custom HOSTS route — requires login on the server so anonymous visitors never see the loading skeleton.
 * Gist data is still loaded on the client after this gate.
 * @returns Client page that fetches Gist files after paint
 */
export default async function CustomDnsPage() {
  await checkAccess({ redirectUrl: '/custom-dns', isApiRouter: false })

  return <CustomDNSPage />
}
