'use client'

import type { CSSProperties, ReactElement } from 'react'
import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const GAP = 6
const PADDING = 8

type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right'

interface TooltipProps {
  /** Content shown in the tooltip; keep short so it stays in viewport */
  content: string
  /** Preferred position relative to trigger; default bottom */
  placement?: TooltipPlacement
  children: ReactElement
}

/**
 * Viewport-safe tooltip: positions so content stays inside the window.
 * Renders via portal to avoid clipping. Uses placement when given; otherwise prefers bottom, flips to top if needed.
 * @param props Component props
 * @param props.content Short label shown in the floating tooltip
 * @param props.placement Preferred edge of the trigger to align the tooltip toward
 * @param props.children Single React element that receives hover/focus to open the tooltip
 * @returns Trigger span plus portaled tooltip layer
 */
export function Tooltip(props: TooltipProps) {
  const { content, children, placement: preferredPlacement = 'bottom' } = props
  const [open, setOpen] = useState(false)
  const [style, setStyle] = useState<CSSProperties>({
    position: 'fixed',
    left: 0,
    top: 0,
    visibility: 'hidden',
  })
  const triggerRef = useRef<HTMLSpanElement | null>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !tooltipRef.current) return

    const trigger = triggerRef.current
    const tooltip = tooltipRef.current
    const rect = trigger.getBoundingClientRect()
    const tw = tooltip.offsetWidth
    const th = tooltip.offsetHeight
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1024
    const vh = typeof window !== 'undefined' ? window.innerHeight : 768

    let left: number
    let top: number

    if (preferredPlacement === 'right') {
      left = rect.right + GAP
      left = Math.min(left, vw - tw - PADDING)
      left = Math.max(PADDING, left)
      top = rect.top + rect.height / 2 - th / 2
      top = Math.max(PADDING, Math.min(vh - th - PADDING, top))
    } else if (preferredPlacement === 'left') {
      left = rect.left - GAP - tw
      left = Math.max(PADDING, left)
      top = rect.top + rect.height / 2 - th / 2
      top = Math.max(PADDING, Math.min(vh - th - PADDING, top))
    } else if (preferredPlacement === 'top') {
      top = rect.top - GAP - th
      top = Math.max(PADDING, top)
      left = rect.left + rect.width / 2 - tw / 2
      left = Math.max(PADDING, Math.min(vw - tw - PADDING, left))
    } else {
      const preferBottom = rect.bottom + GAP + th <= vh - PADDING
      if (preferBottom) {
        top = rect.bottom + GAP
      } else {
        const topPlace = rect.top - GAP - th
        top = topPlace >= PADDING ? topPlace : PADDING
      }
      left = rect.left + rect.width / 2 - tw / 2
      left = Math.max(PADDING, Math.min(vw - tw - PADDING, left))
    }

    setStyle({ left, top, position: 'fixed' as const, visibility: 'visible' })
  }, [open, preferredPlacement])

  const tooltipEl = open && (
    <div
      ref={tooltipRef}
      role="tooltip"
      className="z-[9999] max-w-[min(calc(100vw-16px),14rem)] rounded-md border border-gray-200 bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg whitespace-normal"
      style={style}
    >
      {content}
    </div>
  )

  return (
    <>
      <span
        ref={triggerRef}
        className="inline-flex items-center"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {children}
      </span>
      {typeof document !== 'undefined' && document.body && tooltipEl ? createPortal(tooltipEl, document.body) : null}
    </>
  )
}
