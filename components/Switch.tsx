'use client'

import type { CSSProperties } from 'react'

interface SwitchOption {
  label: string
  value: string
  disabled?: boolean
}

export interface SwitchProps {
  options: SwitchOption[]
  value: string
  onChange?(value: string): void
  className?: string
  disabled?: boolean
}

export default function Switch(props: SwitchProps) {
  const { options, value, onChange, className = '', disabled = false } = props

  if (!options.length) {
    return null
  }

  const activeIndex = Math.max(
    options.findIndex((option) => option.value === value),
    0
  )

  // Find next enabled option
  const getNextEnabledValue = (currentIndex: number): string | null => {
    for (let i = 1; i < options.length; i++) {
      const nextIndex = (currentIndex + i) % options.length
      const nextOption = options[nextIndex]
      if (nextOption && !nextOption.disabled) {
        return nextOption.value
      }
    }
    return null
  }

  const nextValue = getNextEnabledValue(activeIndex)

  const handleToggle = () => {
    if (disabled) {
      return
    }
    if (nextValue && nextValue !== value) {
      onChange?.(nextValue)
    }
  }

  const segmentWidth = 100 / options.length
  const indicatorStyle: CSSProperties = {
    width: `${segmentWidth}%`,
    left: `${segmentWidth * activeIndex}%`,
  }

  const gridStyle: CSSProperties = {
    gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
  }

  return (
    <div
      className={`inline-flex rounded-full border border-slate-200 bg-white p-1 text-xs font-semibold text-slate-500 shadow-inner ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={activeIndex === options.length - 1}
        aria-disabled={disabled}
        onClick={handleToggle}
        disabled={disabled}
        className={`relative inline-flex w-full select-none overflow-visible rounded-full bg-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 ${disabled ? 'cursor-not-allowed' : ''}`}
      >
        <span className="pointer-events-none absolute inset-y-0 rounded-full bg-slate-900 text-white shadow transition-all duration-200 ease-out" style={indicatorStyle} />
        <span className="relative z-10 grid w-full" style={gridStyle}>
          {options.map((option) => {
            const isActive = option.value === value
            const isDisabled = option.disabled
            return (
              <span
                key={option.value}
                className={`px-4 py-1.5 text-center transition w-full ${isDisabled ? 'cursor-not-allowed opacity-50' : ''} ${isActive ? 'text-white' : 'text-slate-500'}`}
              >
                {option.label}
              </span>
            )
          })}
        </span>
      </button>
    </div>
  )
}
