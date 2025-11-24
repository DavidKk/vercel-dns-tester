'use client'

import FeatherIcon from 'feather-icons-react'
import { useEffect, useMemo, useRef, useState } from 'react'

interface Option {
  label: string
  value: string
}

interface FormSelectProps {
  label: string
  helperText?: string
  options: Option[]
  value: string
  onChange?(value: string): void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export default function FormSelect(props: FormSelectProps) {
  const { label, helperText, options, value, onChange, placeholder = 'Select', disabled, className = '' } = props
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = useMemo(() => options.find((option) => option.value === value), [options, value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (nextValue: string) => {
    onChange?.(nextValue)
    setIsOpen(false)
  }

  return (
    <label className="block text-left">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {helperText ? <span className="text-xs text-slate-400">{helperText}</span> : null}
      </div>

      <div ref={containerRef} className={`relative mt-2 ${className}`}>
        <button
          type="button"
          className={`flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2.5 pr-11 text-left text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${disabled ? 'cursor-not-allowed opacity-70' : 'hover:border-slate-300'}`}
          onClick={() => setIsOpen((prev) => !prev)}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <FeatherIcon
            icon="chevron-down"
            size={16}
            className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition ${isOpen ? 'rotate-180 text-slate-600' : ''}`}
          />
        </button>

        {isOpen && !disabled ? (
          <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            <ul role="listbox" className="max-h-60 overflow-y-auto py-1 text-sm text-slate-800">
              {options.map((option) => {
                const active = option.value === selected?.value
                return (
                  <li key={option.value}>
                    <button
                      type="button"
                      className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm transition ${active ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50'}`}
                      onClick={() => handleSelect(option.value)}
                    >
                      <span className="truncate">{option.label}</span>
                      {active ? <FeatherIcon icon="check" size={16} className="text-indigo-500" /> : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </label>
  )
}
