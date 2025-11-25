import type { ComponentProps } from 'react'

export interface InputProps extends ComponentProps<'input'> {
  label?: string
  helperText?: string
  error?: boolean
  errorMessage?: string
  className?: string
}

export default function Input(props: InputProps) {
  const { label, helperText, error, errorMessage, className = '', ...rest } = props

  const inputClass = `w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
    error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''
  } ${className}`

  if (label) {
    return (
      <label className="flex flex-col gap-2 text-left">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <input className={inputClass} {...rest} />
        {helperText && <p className="text-xs text-slate-500">{helperText}</p>}
        {error && errorMessage && <p className="text-xs text-red-600">{errorMessage}</p>}
      </label>
    )
  }

  return <input className={inputClass} {...rest} />
}
