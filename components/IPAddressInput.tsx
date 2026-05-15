'use client'

import { useEffect, useRef, useState } from 'react'
import { FiCheck, FiCopy } from 'react-icons/fi'

interface IPAddressInputProps {
  value?: string | null
  className?: string
}

export default function IPAddressInput(props: IPAddressInputProps) {
  const { value, className = '' } = props
  const inputRef = useRef<HTMLInputElement>(null)
  const [copied, setCopied] = useState(false)
  const displayValue = value || 'N/A'

  useEffect(() => {
    if (!copied) {
      return
    }

    const timer = window.setTimeout(() => setCopied(false), 1200)
    return () => window.clearTimeout(timer)
  }, [copied])

  const selectValue = () => {
    inputRef.current?.select()
  }

  const copyValue = async () => {
    selectValue()

    try {
      await navigator.clipboard.writeText(displayValue)
      setCopied(true)
    } catch {
      document.execCommand('copy')
      setCopied(true)
    }
  }

  return (
    <div
      className={`flex max-w-full overflow-hidden rounded-md border border-app-accent/20 bg-app-accentSoft/35 text-app-text transition focus-within:border-app-accent focus-within:bg-app-surface focus-within:ring-2 focus-within:ring-app-accent/15 ${className}`}
    >
      <input
        ref={inputRef}
        value={displayValue}
        readOnly
        onClick={selectValue}
        aria-label="DNS record data"
        className="min-w-0 flex-1 cursor-text bg-transparent px-3 py-2 font-mono text-sm text-app-text outline-none selection:bg-app-accent selection:text-white"
      />
      <button
        type="button"
        onClick={copyValue}
        className="inline-flex h-auto w-9 shrink-0 items-center justify-center border-l border-app-border/70 bg-app-surface/60 text-app-muted transition hover:bg-app-surface hover:text-app-text"
        aria-label="Copy DNS record data"
        title="Copy"
      >
        {copied ? <FiCheck size={15} /> : <FiCopy size={15} />}
      </button>
    </div>
  )
}
