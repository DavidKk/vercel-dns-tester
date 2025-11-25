'use client'

import type { ComponentProps, KeyboardEvent, ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

export interface SuggestionInputOption {
  label: string
  value: string
  description?: string
}

export interface SuggestionInputProps extends Omit<ComponentProps<'input'>, 'onChange' | 'value' | 'onSelect'> {
  options: SuggestionInputOption[]
  value: string
  onChange(value: string): void
  onSelect?(value: string): void
  maxResults?: number
  suffix?: ReactNode
}

export default function SuggestionInput(props: SuggestionInputProps) {
  const { options, value, onChange, onSelect, maxResults = 10, className = '', suffix, ...rest } = props
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const filteredOptions = useMemo(() => {
    if (!value.trim()) {
      return options.slice(0, maxResults)
    }
    const lowerValue = value.toLowerCase()
    return options.filter((option) => option.label.toLowerCase().includes(lowerValue) || option.value.toLowerCase().includes(lowerValue)).slice(0, maxResults)
  }, [options, value, maxResults])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node) && listRef.current && !listRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    setIsOpen(true)
    setHighlightedIndex(-1)
  }

  const handleSelect = (option: SuggestionInputOption) => {
    onChange(option.value)
    onSelect?.(option.value)
    setIsOpen(false)
    setHighlightedIndex(-1)
    inputRef.current?.blur()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filteredOptions.length === 0) {
      if (e.key === 'ArrowDown') {
        setIsOpen(true)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleSelect(filteredOptions[highlightedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setHighlightedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement
      if (item) {
        item.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex])

  return (
    <div className={`relative ${className}`}>
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className={`${suffix ? 'pr-10' : ''}`}
          {...rest}
        />
        {suffix && <div className="absolute top-0 bottom-0 right-0 flex items-center justify-center">{suffix}</div>}
      </div>
      {isOpen && filteredOptions.length > 0 && (
        <ul ref={listRef} className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg" role="listbox">
          {filteredOptions.map((option, index) => (
            <li
              key={option.value}
              role="option"
              aria-selected={highlightedIndex === index}
              onClick={() => handleSelect(option)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`cursor-pointer px-4 py-2 text-sm transition ${highlightedIndex === index ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}`}
            >
              <div className="font-medium">{option.label}</div>
              {option.description ? <div className="text-xs text-slate-500">{option.description}</div> : <div className="text-xs text-slate-500">{option.value}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
