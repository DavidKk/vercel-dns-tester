'use client'

import type { ComponentProps } from 'react'
import { useMemo } from 'react'

import SuggestionInput, { type SuggestionInputOption } from './SuggestionInput'

const COMMON_DNS_SERVERS: SuggestionInputOption[] = [
  { label: 'Google Public DNS', value: 'https://dns.google' },
  { label: 'Cloudflare DNS', value: '1.1.1.1' },
  { label: 'Cloudflare DNS (IPv6)', value: '1.0.0.1' },
  { label: 'Quad9 DNS', value: '9.9.9.9' },
  { label: 'OpenDNS', value: '208.67.222.222' },
  { label: 'OpenDNS (Secondary)', value: '208.67.220.220' },
  { label: 'AdGuard DNS', value: '94.140.14.14' },
  { label: 'AdGuard DNS (Family)', value: '94.140.14.15' },
  { label: 'NextDNS', value: '45.90.28.0' },
  { label: 'Quad9 (Secure)', value: 'https://dns.quad9.net' },
]

export interface DNSInputProps extends Omit<ComponentProps<'input'>, 'onChange' | 'value' | 'onSelect'> {
  value: string
  onChange(value: string): void
  onSelect?(value: string): void
}

export default function DNSInput(props: DNSInputProps) {
  const { value, onChange, onSelect, className = '', ...rest } = props

  const options = useMemo(() => {
    const optionsList = [...COMMON_DNS_SERVERS]

    // Add current value to suggestions if it's an HTTPS URL not in the list
    if (value && value.startsWith('https://')) {
      const exists = optionsList.some((option) => option.value === value)
      if (!exists) {
        try {
          const url = new URL(value)
          const hostname = url.hostname
          optionsList.unshift({ label: hostname, value })
        } catch {
          // Use original value as label if URL parsing fails
          optionsList.unshift({ label: value, value })
        }
      }
    }

    return optionsList
  }, [value])

  return <SuggestionInput options={options} value={value} onChange={onChange} onSelect={onSelect} className={className} {...rest} />
}
