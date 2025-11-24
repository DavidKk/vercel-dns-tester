'use client'

import type { ComponentProps } from 'react'

import SuggestionInput, { type SuggestionInputOption } from './SuggestionInput'

const HEADER_OPTIONS: SuggestionInputOption[] = [{ label: 'X-DOH-API-KEY', value: 'x-doh-api-key', description: 'Authorization key for this project' }]

export interface CustomHeaderInputProps extends Omit<ComponentProps<'input'>, 'onChange' | 'value' | 'onSelect'> {
  value: string
  onChange(value: string): void
  onSelect?(value: string): void
}

export default function CustomHeaderInput(props: CustomHeaderInputProps) {
  const { value, onChange, onSelect, className = '', ...rest } = props

  return <SuggestionInput options={HEADER_OPTIONS} value={value} onChange={onChange} onSelect={onSelect} className={className} {...rest} />
}
