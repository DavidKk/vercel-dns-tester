import type { NextRequest } from 'next/server'

import { api } from '@/initializer/controller'
import { jsonSuccess } from '@/initializer/response'
import { withAuthHandler } from '@/initializer/wrapper'
import type { FilesInWriteGistFiles, Gist } from '@/services/gist'
import { fetchGist, getGistInfo, writeGistFiles } from '@/services/gist'

export interface CustomDnsFileEntry {
  content: string
  rawUrl: string
}

export type CustomDnsFilesMap = Record<string, CustomDnsFileEntry>

/**
 * Map GitHub Gist file entries to the API response shape
 * @param gist Gist payload from GitHub
 * @returns Filename → content and raw URL
 */
function mapGistFiles(gist: Gist): CustomDnsFilesMap {
  return Object.fromEntries(Object.entries(gist.files).map(([filename, { content, raw_url: rawUrl }]) => [filename, { content, rawUrl }]))
}

export const GET = api(
  withAuthHandler(async () => {
    const { gistId, gistToken } = getGistInfo()
    const gist = await fetchGist({ gistId, gistToken })
    return jsonSuccess({ files: mapGistFiles(gist) })
  })
)

export const PUT = api(
  withAuthHandler(async (req: NextRequest) => {
    const files = (await req.json()) as FilesInWriteGistFiles[]
    const { gistId, gistToken } = getGistInfo()
    await writeGistFiles({ gistId, gistToken, files })
    return jsonSuccess(null)
  })
)
