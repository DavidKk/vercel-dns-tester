import { fetchFiles } from '@/app/actions/custom-dns'
import { checkAccess } from '@/services/auth/access'

import CustomDNS from './CustomDNS'

export default async function Home() {
  await checkAccess({ redirectUrl: '/custom-dns', isApiRouter: false })

  const files = await fetchFiles()
  return <CustomDNS files={files} />
}
