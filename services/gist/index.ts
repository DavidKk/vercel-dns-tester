export interface Gist {
  url: string
  forks_url: string
  commits_url: string
  html_url: string
  description: string
  files: Record<
    string,
    {
      content: string
      raw_url: string
    }
  >
  created_at: string
  updated_at: string
}

export interface FetchGistFileParams {
  gistId: string
  gistToken: string
}

export async function fetchGist(params: FetchGistFileParams): Promise<Gist> {
  const { gistId, gistToken } = params
  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: {
      Authorization: `token ${gistToken}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch gist')
  }

  return response.json()
}

export interface ReadGistFileParams extends FetchGistFileParams {
  fileName: string
}

export async function readGistFile(params: ReadGistFileParams) {
  const { gistId, gistToken, fileName } = params
  const { files } = await fetchGist({ gistId, gistToken })

  const file = files[fileName]
  if (!file) {
    throw new Error(`File ${fileName} not found in gist ${gistId}`)
  }

  return file.content
}

export interface FilesInWriteGistFiles {
  file: string
  content: string | null
}

export interface WriteGistFilesParams extends FetchGistFileParams {
  files: FilesInWriteGistFiles[]
}

export async function writeGistFiles(params: WriteGistFilesParams) {
  const { gistId, gistToken, files: inFiles } = params
  const files = Object.fromEntries(
    (function* () {
      for (const { file, content } of inFiles) {
        // If content is null, delete the file
        if (content === null) {
          yield [file, null]
          continue
        }

        yield [file, { content }]
      }
    })()
  )

  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `token ${gistToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ files }),
  })

  if (!response.ok) {
    throw new Error('Failed to update gist')
  }

  return response.json()
}

export function getGistInfo() {
  const gistId = process.env.GIST_ID
  const gistToken = process.env.GIST_TOKEN

  if (!gistId) {
    throw new Error('process.env.GIST_ID is not set')
  }

  if (!gistToken) {
    throw new Error('process.env.GIST_TOKEN is not set')
  }

  return {
    gistId,
    gistToken,
  }
}
