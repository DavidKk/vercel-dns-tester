'use client'

import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react'

export interface AlertProps {
  duration?: number
}

interface ShowOptions {
  type?: 'success' | 'error'
}

export interface AlertImperativeHandler {
  show: (message: string, options?: ShowOptions) => Promise<void>
}

export default forwardRef<AlertImperativeHandler, AlertProps>(function Alert(props: AlertProps, ref) {
  const { duration = 0 } = props

  const [type, setType] = useState('success')
  const [message, setMessage] = useState('')
  const [count, setCount] = useState(duration)
  const timerRef = useRef<number | NodeJS.Timeout>(null)

  const show = useCallback((message: string, options?: ShowOptions) => {
    return new Promise<void>((resolve) => {
      const { type = 'success' } = options ?? {}

      setType(type)
      setMessage(message)
      setCount(3)

      timerRef.current = setInterval(() => {
        setCount((count) => {
          if (count <= 1) {
            clearInterval(timerRef.current!)

            resolve()
            return 0
          }

          return count - 1
        })
      }, 1e3)
    })
  }, [])

  useImperativeHandle(ref, () => ({ show }))

  if (count <= 0) {
    return null
  }

  return (
    <div
      className={`w-full flex px-3 py-2 text-sm text-white ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} rounded-sm opacity-100 animate-fade-out`}
      style={{ animationDelay: '2.8s' }}
    >
      {message} <span className="ml-auto">{count}s</span>
    </div>
  )
})
