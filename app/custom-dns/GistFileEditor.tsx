'use client'

import { FiCopy } from 'react-icons/fi'

import { PlainTextEditor } from '@/components/PlainTextEditor'

export interface GistFileEditorProps {
  /** Map of filename to file content */
  files: Record<string, string>
  /** Currently selected filename */
  activeFile: string
  /** Called when the content of a file is edited */
  onFileContentChange: (filename: string, content: string) => void
}

/**
 * Lightweight multi-file editor for Gist-hosted HOSTS configuration
 * @param props Editor state and change handlers
 * @returns Tabbed file editor with a CodeMirror plain-text surface (same CM6 stack as vercel-text-craft)
 */
export function GistFileEditor(props: GistFileEditorProps) {
  const { files, activeFile, onFileContentChange } = props

  const activeContent = activeFile ? (files[activeFile] ?? '') : ''

  return (
    <div className="flex h-full min-h-0 flex-col bg-app-surface">
      {activeFile ? (
        <div className="editor-container group relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="absolute right-3 top-2 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              title="Copy file contents"
              aria-label="Copy file contents"
              onClick={() => void navigator.clipboard.writeText(activeContent)}
              className="rounded-md border border-app-border bg-app-surface/95 p-1.5 text-app-muted shadow-sm transition hover:bg-app-accentSoft hover:text-app-accent"
            >
              <FiCopy size={16} />
            </button>
          </div>
          <div className="flex min-h-0 flex-1 overflow-hidden bg-app-surface">
            <PlainTextEditor
              key={activeFile}
              value={activeContent}
              onChange={(next) => onFileContentChange(activeFile, next)}
              placeholder="# HOSTS format\n192.168.1.1 example.com"
              className="flex-1"
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-app-muted">No HOSTS content is available.</div>
      )}
    </div>
  )
}
