import { api } from '@/initializer/controller'
import { getGistInfo, readGistFile, writeGistFile } from '@/services/gist'
import { checkApiAccess } from '@/services/auth/access'
import { GIST_HOSTS_FILE } from '@/app/dns-query/constants'
import { unauthorized } from '@/initializer/response'

export const PUT = api(async (req) => {
  if (!checkApiAccess()) {
    return unauthorized()
  }

  const params = getGistInfo()
  const newHosts: Record<string, string> = await req.json()
  const existingContent = await readGistFile({ ...params, fileName: GIST_HOSTS_FILE })
  const existingHosts: Record<string, string> = {}
  if (existingContent) {
    const lines = existingContent.split('\n')
    for (const line of lines) {
      const [ip, domain] = line.trim().split(/\s+/)
      if (ip && domain) {
        existingHosts[domain] = ip
      }
    }
  }

  const mergedHosts = { ...existingHosts, ...newHosts }
  const content = Object.entries(mergedHosts)
    .map(([domain, ip]) => `${ip}\t${domain}`)
    .join('\n')

  await writeGistFile({ ...params, fileName: GIST_HOSTS_FILE, content })

  return { success: true }
})

export const DELETE = api(async (req) => {
  if (!checkApiAccess()) {
    return unauthorized()
  }

  const params = getGistInfo()
  const domainsToDelete: string[] = await req.json()

  const existingContent = await readGistFile({ ...params, fileName: GIST_HOSTS_FILE })
  const existingHosts: Record<string, string> = {}

  if (existingContent) {
    const lines = existingContent.split('\n')
    for (const line of lines) {
      const [ip, domain] = line.trim().split(/\s+/)
      if (ip && domain && !domainsToDelete.includes(domain)) {
        existingHosts[domain] = ip
      }
    }
  }

  const content = Object.entries(existingHosts)
    .map(([domain, ip]) => `${ip}\t${domain}`)
    .join('\n')

  await writeGistFile({ ...params, fileName: GIST_HOSTS_FILE, content })

  return { success: true }
})
