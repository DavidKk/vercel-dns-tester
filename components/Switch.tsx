'use client'

import type { CSSProperties } from 'react'

interface SwitchOption {
  label: string
  value: string
}

export interface SwitchProps {
  options: SwitchOption[]
  value: string
  onChange?(value: string): void
  className?: string
}

export default function Switch(props: SwitchProps) {
  const { options, value, onChange, className = '' } = props

  if (!options.length) {
    return null
  }

  const activeIndex = Math.max(
    options.findIndex((option) => option.value === value),
    0
  )
  const nextValue = options[(activeIndex + 1) % options.length]?.value ?? value

  const handleToggle = () => {
    if (nextValue !== value) {
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
    <div className={`inline-flex rounded-full border border-slate-200 bg-white p-1 text-xs font-semibold text-slate-500 shadow-inner ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={activeIndex === options.length - 1}
        onClick={handleToggle}
        className="relative inline-flex w-full select-none overflow-hidden rounded-full bg-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30"
      >
        <span className="pointer-events-none absolute inset-y-0 rounded-full bg-slate-900 text-white shadow transition-all duration-200 ease-out" style={indicatorStyle} />
        <span className="relative z-10 grid w-full" style={gridStyle}>
          {options.map((option) => {
            const isActive = option.value === value
            return (
              <span key={option.value} className={`px-4 py-1.5 text-center transition ${isActive ? 'text-white' : 'text-slate-500'}`}>
                {option.label}
              </span>
            )
          })}
        </span>
      </button>
    </div>
  )
}
