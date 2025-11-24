import { checkAccess } from '@/services/auth/access'

import { fetchFiles } from './actions'
import Editor from './Editor'

export default async function Home() {
  await checkAccess({ redirectUrl: '/editor', isApiRouter: false })

  const files = await fetchFiles()
  return <Editor files={files} />
}
