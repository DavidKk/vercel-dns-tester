'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { FiCheck, FiChevronDown } from 'react-icons/fi'

import { CONTROL_CLASS, CONTROL_HELPER_CLASS, CONTROL_LABEL_CLASS } from './controlStyles'

interface Option {
  label: string
  value: string
  disabled?: boolean
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
        <span className={CONTROL_LABEL_CLASS}>{label}</span>
        {helperText ? <span className={CONTROL_HELPER_CLASS}>{helperText}</span> : null}
      </div>

      <div ref={containerRef} className={`relative mt-2 ${className}`}>
        <button
          type="button"
          className={`flex ${CONTROL_CLASS} items-center justify-between pr-11 text-left transition ${disabled ? 'cursor-not-allowed opacity-70' : 'hover:border-app-accent'}`}
          onClick={() => setIsOpen((prev) => !prev)}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <FiChevronDown
            size={16}
            className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-app-muted transition ${isOpen ? 'rotate-180 text-app-text' : ''}`}
          />
        </button>

        {isOpen && !disabled ? (
          <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-app-border bg-app-surface shadow-lg">
            <ul role="listbox" className="max-h-60 overflow-y-auto py-1 text-sm text-app-text">
              {options.map((option) => {
                const active = option.value === selected?.value
                const isDisabled = option.disabled
                return (
                  <li key={option.value}>
                    <button
                      type="button"
                      className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm transition ${
                        isDisabled ? 'cursor-not-allowed opacity-50' : active ? 'bg-app-accentSoft text-app-accent' : 'hover:bg-app-subtle'
                      }`}
                      onClick={() => !isDisabled && handleSelect(option.value)}
                      disabled={isDisabled}
                    >
                      <span className="truncate">{option.label}</span>
                      {active ? <FiCheck size={16} className="text-app-accent" /> : null}
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
