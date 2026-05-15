'use client'

import { useRequest } from 'ahooks'
import { useMemo, useState } from 'react'
import { FiRotateCcw, FiSave } from 'react-icons/fi'

import { updateFiles } from '@/app/actions/custom-dns'
import { Spinner } from '@/components/Spinner'

import { buildFileUpdates } from './buildFileUpdates'
import { GistFileEditor } from './GistFileEditor'

export interface CustomDNSProps {
  files: Record<
    string,
    {
      content: string
      rawUrl: string
    }
  >
}

/**
 * Convert Gist file entries from the server into a filename → content map
 * @param inFiles Files loaded from the Gist API
 * @returns Editor file map
 */
function filesFromProps(inFiles: CustomDNSProps['files']): Record<string, string> {
  return Object.fromEntries(Object.entries(inFiles).map(([file, { content }]) => [file, content]))
}

/**
 * Custom HOSTS editor backed by a GitHub Gist
 * @param props Gist files from the server
 * @returns Multi-file editor with save to Gist
 */
export function CustomDNS(props: CustomDNSProps) {
  const { files: inFiles } = props
  const [initialFiles, setInitialFiles] = useState(() => filesFromProps(inFiles))
  const [files, setFiles] = useState(() => filesFromProps(inFiles))
  const [activeFile] = useState(() => Object.keys(filesFromProps(inFiles))[0] ?? '')

  const hasChanges = useMemo(() => buildFileUpdates(initialFiles, files).length > 0, [initialFiles, files])

  const { run: save, loading } = useRequest(
    async () => {
      const updates = buildFileUpdates(initialFiles, files)
      if (updates.length === 0) {
        return
      }

      await updateFiles(...updates)
      setInitialFiles({ ...files })
    },
    {
      manual: true,
      throttleWait: 1e3,
    }
  )

  const handleReset = () => {
    setFiles({ ...initialFiles })
  }

  return (
    <main className="flex min-h-0 flex-1 bg-app-subtle text-app-text">
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-3 px-4 py-4 md:px-6 lg:px-8">
        <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-app-border bg-app-surface shadow-sm">
          <GistFileEditor files={files} activeFile={activeFile} onFileContentChange={(filename, content) => setFiles((prev) => ({ ...prev, [filename]: content }))} />
        </div>
        <div className="flex shrink-0 justify-end gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={loading || !hasChanges}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-app-border bg-app-surface px-4 text-sm font-semibold text-app-muted transition hover:border-app-accent/40 hover:bg-app-accentSoft hover:text-app-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiRotateCcw size={16} />
            Reset
          </button>
          <button
            type="button"
            onClick={save}
            disabled={loading || !hasChanges || !activeFile}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-app-accent px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-app-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="flex h-4 w-4 items-center justify-center">{loading ? <Spinner /> : <FiSave size={16} />}</span>
            Save
          </button>
        </div>
      </div>
    </main>
  )
}
