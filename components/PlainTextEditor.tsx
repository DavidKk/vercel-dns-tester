'use client'

import { indentWithTab } from '@codemirror/commands'
import type { Extension } from '@codemirror/state'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, placeholder } from '@codemirror/view'
import { minimalSetup } from 'codemirror'
import { useEffect, useRef } from 'react'

/**
 * Replace editor document content when it differs from the controlled value
 * @param editor CodeMirror view instance
 * @param value Next document text
 */
function setEditorValue(editor: EditorView, value: string) {
  const { state } = editor
  const doc = state.doc
  const currentValue = doc.toString()

  if (currentValue === value) {
    return
  }

  editor.dispatch({
    changes: {
      from: 0,
      to: doc.length,
      insert: value,
    },
  })
}

export interface PlainTextEditorProps {
  /** Controlled document text */
  value: string
  /** Called when the document text changes */
  onChange: (value: string) => void
  /** When true, the editor is read-only */
  disabled?: boolean
  /** Optional root class for the mount container */
  className?: string
  /** Hint shown when the document is empty */
  placeholder?: string
}

/**
 * Minimal CodeMirror 6 plain-text editor using `minimalSetup` (no line-number or fold gutters)
 * @param props Value, change handler, and display options
 * @returns A client-only editor mount
 */
export function PlainTextEditor(props: PlainTextEditorProps) {
  const { value, onChange, disabled = false, className = '', placeholder: placeholderText } = props
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!containerRef.current) {
      return
    }

    const theme = EditorView.theme({
      '&': {
        height: '100%',
        fontSize: '14px',
        backgroundColor: 'rgb(var(--app-surface) / 1)',
        color: 'rgb(var(--app-text) / 1)',
      },
      '.cm-scroller': {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        padding: '12px',
      },
      '.cm-activeLine': {
        backgroundColor: 'rgb(var(--app-accent-soft) / 0.45)',
      },
      '.cm-content': {
        caretColor: 'rgb(var(--app-accent) / 1)',
        padding: 0,
        minWidth: '100%',
      },
    })

    const extensions: Extension[] = [
      minimalSetup,
      keymap.of([indentWithTab]),
      EditorView.editable.of(!disabled),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChangeRef.current(update.state.doc.toString())
        }
      }),
    ]

    if (placeholderText) {
      extensions.push(placeholder(placeholderText))
    }

    extensions.push(theme)

    const startState = EditorState.create({
      doc: value,
      extensions,
    })

    const view = new EditorView({
      state: startState,
      parent: containerRef.current,
    })

    view.dom.style.height = '100%'
    view.dom.style.outline = 'none'
    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [disabled, placeholderText])

  useEffect(() => {
    const view = viewRef.current
    if (!view) {
      return
    }

    setEditorValue(view, value)
  }, [value])

  return <div ref={containerRef} className={`h-full min-h-0 w-full min-w-0 ${className}`} />
}
