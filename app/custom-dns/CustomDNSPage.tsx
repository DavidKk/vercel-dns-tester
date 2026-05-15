'use client'

import { useRequest } from 'ahooks'
import { useRouter } from 'next/navigation'

import type { CustomDnsFilesMap } from '@/app/api/custom-dns/files/route'

import { CustomDNS } from './CustomDNS'
import { CustomDNSSkeleton } from './CustomDNSSkeleton'

interface ApiSuccess<T> {
  code: number
  message: string
  data: T
}

/**
 * Load custom HOSTS Gist files from the API
 * @returns Gist file map for the editor
 */
async function fetchCustomDnsFiles(): Promise<CustomDnsFilesMap> {
  const response = await fetch('/api/custom-dns/files', { cache: 'no-store' })

  if (response.status === 401) {
    const error = new Error('unauthorized')
    error.name = 'UnauthorizedError'
    throw error
  }

  if (!response.ok) {
    throw new Error('Failed to load HOSTS files')
  }

  const payload = (await response.json()) as ApiSuccess<{ files: CustomDnsFilesMap }>
  if (payload.code !== 0 || !payload.data?.files) {
    throw new Error(payload.message || 'Failed to load HOSTS files')
  }

  return payload.data.files
}

/**
 * Client-first custom DNS page: shell renders immediately, data loads via API
 * @returns Skeleton while loading, then the HOSTS editor
 */
export function CustomDNSPage() {
  const router = useRouter()

  const {
    data: files,
    loading,
    error,
  } = useRequest(fetchCustomDnsFiles, {
    onError: (err) => {
      if (err instanceof Error && err.name === 'UnauthorizedError') {
        router.replace(`/login?redirectUrl=${encodeURIComponent('/custom-dns')}`)
      }
    },
  })

  if (loading || !files) {
    return <CustomDNSSkeleton />
  }

  if (error && error.name !== 'UnauthorizedError') {
    return (
      <main className="flex min-h-0 flex-1 items-center justify-center bg-app-subtle px-4 text-app-text">
        <p className="rounded-lg border border-app-danger bg-app-dangerSoft px-4 py-3 text-sm text-app-danger">{error.message || 'Failed to load HOSTS files'}</p>
      </main>
    )
  }

  return <CustomDNS files={files} />
}
