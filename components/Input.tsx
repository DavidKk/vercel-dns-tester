import type { ComponentProps } from 'react'

import { CONTROL_CLASS, CONTROL_HELPER_CLASS, CONTROL_LABEL_CLASS } from './controlStyles'

export interface InputProps extends ComponentProps<'input'> {
  label?: string
  helperText?: string
  error?: boolean
  errorMessage?: string
  className?: string
}

export default function Input(props: InputProps) {
  const { label, helperText, error, errorMessage, className = '', ...rest } = props

  const inputClass = `${CONTROL_CLASS} ${error ? 'border-app-danger focus:border-app-danger focus:ring-app-danger/15' : ''} ${className}`

  if (label) {
    return (
      <label className="flex flex-col gap-2 text-left">
        <span className={CONTROL_LABEL_CLASS}>{label}</span>
        <input className={inputClass} {...rest} />
        {helperText && <p className={CONTROL_HELPER_CLASS}>{helperText}</p>}
        {error && errorMessage && <p className="text-xs text-app-danger">{errorMessage}</p>}
      </label>
    )
  }

  return <input className={inputClass} {...rest} />
}
