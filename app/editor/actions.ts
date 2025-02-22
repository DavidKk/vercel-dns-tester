'use server'

import { withAuthAction } from '@/initializer/wrapper'
import type { FilesInWriteGistFiles } from '@/services/gist'
import { fetchGist, getGistInfo, writeGistFiles } from '@/services/gist'

export const fetchFiles = withAuthAction(async () => {
  const { gistId, gistToken } = getGistInfo()
  const gist = await fetchGist({ gistId, gistToken })

  return Object.fromEntries(
    (function* () {
      for (const [filename, { content, raw_url: rawUrl }] of Object.entries(gist.files)) {
        yield [filename, { content, rawUrl }]
      }
    })()
  )
})

export const updateFiles = withAuthAction(async (...files: FilesInWriteGistFiles[]) => {
  const { gistId, gistToken } = getGistInfo()
  await writeGistFiles({ gistId, gistToken, files })
})
