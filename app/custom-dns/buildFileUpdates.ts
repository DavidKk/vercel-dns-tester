import type { FilesInWriteGistFiles } from '@/services/gist'

/**
 * Build Gist patch entries by diffing current editor state against the initial snapshot
 * @param initialFiles Files loaded from the Gist (filename → content)
 * @param currentFiles Current editor state (filename → content)
 * @returns Files to create, update, or delete via the Gist API
 */
export function buildFileUpdates(initialFiles: Record<string, string>, currentFiles: Record<string, string>): FilesInWriteGistFiles[] {
  const updates: FilesInWriteGistFiles[] = []

  for (const [file, content] of Object.entries(currentFiles)) {
    if (initialFiles[file] !== content) {
      updates.push({ file, content })
    }
  }

  for (const file of Object.keys(initialFiles)) {
    if (!(file in currentFiles)) {
      updates.push({ file, content: null })
    }
  }

  return updates
}
