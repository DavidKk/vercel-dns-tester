export const CONTROL_HEIGHT_CLASS = 'min-h-11'
export const CONTROL_RADIUS_CLASS = 'rounded-lg'
export const CONTROL_TEXT_CLASS = 'text-sm text-app-text'
export const CONTROL_BORDER_CLASS = 'border border-app-border'
export const CONTROL_SURFACE_CLASS = 'bg-app-surface'
export const CONTROL_SHADOW_CLASS = 'shadow-sm'
export const CONTROL_FOCUS_CLASS = 'focus:border-app-accent focus:outline-none focus:ring-2 focus:ring-app-accent/15'
export const CONTROL_FOCUS_WITHIN_CLASS = 'focus-within:border-app-accent focus-within:outline-none focus-within:ring-2 focus-within:ring-app-accent/15'
export const CONTROL_PADDING_CLASS = 'px-4 py-2.5'
export const CONTROL_LABEL_CLASS = 'text-sm font-medium text-app-muted'
export const CONTROL_HELPER_CLASS = 'text-xs text-app-muted'

export const CONTROL_CLASS = [
  'w-full',
  CONTROL_HEIGHT_CLASS,
  CONTROL_RADIUS_CLASS,
  CONTROL_BORDER_CLASS,
  CONTROL_SURFACE_CLASS,
  CONTROL_PADDING_CLASS,
  CONTROL_TEXT_CLASS,
  CONTROL_SHADOW_CLASS,
  CONTROL_FOCUS_CLASS,
].join(' ')

export const CONTROL_WRAPPER_CLASS = [
  'relative w-full',
  CONTROL_HEIGHT_CLASS,
  CONTROL_RADIUS_CLASS,
  CONTROL_BORDER_CLASS,
  CONTROL_SURFACE_CLASS,
  CONTROL_TEXT_CLASS,
  CONTROL_SHADOW_CLASS,
  'transition',
  CONTROL_FOCUS_WITHIN_CLASS,
].join(' ')
