'use client'

import React from 'react'
import { useClient } from '@/hooks/useClient'
import { isInvalidDate } from '@/utils/date'

const formatBuildTime = (date: Date) => {
  try {
    return date.toLocaleString()
  } catch {
    return ''
  }
}

function BuildTime() {
  const isClient = useClient()
  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME
  const date = isClient && buildTime ? new Date(buildTime) : null
  const isValidDate = date && !isInvalidDate(date)

  if (!isValidDate) {
    return <div className="text-xs font-medium text-gray-600 tracking-wide">&nbsp;</div>
  }

  return (
    <div className="text-xs font-medium text-gray-600 tracking-wide">
      Build Time: <span className="font-mono text-gray-700">{formatBuildTime(date)}</span>
    </div>
  )
}

const areEqual = () => true
export default React.memo(BuildTime, areEqual)
