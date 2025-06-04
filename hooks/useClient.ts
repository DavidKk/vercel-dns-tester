import { useEffect, useState } from 'react'

export function useClient() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    setReady(true)
  }, [])

  return ready
}
