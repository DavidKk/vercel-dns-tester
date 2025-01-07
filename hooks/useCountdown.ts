import { useState, useEffect, useCallback, useRef } from 'react'

export interface UseCountdownOptions {
  initialCount: number
  onEnd?: () => void
}

export function useCountdown(props: UseCountdownOptions) {
  const { initialCount, onEnd } = props
  const [count, setCount] = useState(initialCount)
  const [isRunning, setIsRunning] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const run = useCallback(() => {
    if (!isRunning) {
      setIsRunning(true)
    }
  }, [isRunning])

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setCount(initialCount)
    setIsRunning(false)
  }, [initialCount])

  useEffect(() => {
    if (!isRunning || count === 0) {
      if (count === 0 && onEnd) onEnd()
      return
    }

    timerRef.current = setTimeout(() => setCount((prev) => prev - 1), 1000)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [isRunning, count, onEnd])

  return { count, run, reset, isRunning }
}
