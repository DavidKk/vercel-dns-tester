'use server'

import { name } from '@/package.json'
import { formatProjectName } from '@/utils/format'

const VERCEL_API_URL = 'https://api.vercel.com'

export interface VercelProject {
  name: string
  link: string
}

async function fetchVercelProjects(): Promise<any[]> {
  if (!process.env.VERCEL_ACCESS_TOKEN) {
    return []
  }

  const response = await fetch(`${VERCEL_API_URL}/v9/projects`, {
    headers: {
      Authorization: `Bearer ${process.env.VERCEL_ACCESS_TOKEN}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch projects: ${response.statusText}`)
  }

  const data = await response.json()
  return data.projects || []
}

export async function getProjects(): Promise<VercelProject[]> {
  const projects = await fetchVercelProjects().catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Error fetching Vercel projects:', error)

    return []
  })

  const excludes = process.env.VERCEL_PROJECT_EXCLUDES?.split(',') || []
  const vercels = projects.filter(({ name: projectName, targets }) => {
    if (projectName === name) {
      return false
    }

    if (!projectName.startsWith('vercel-')) {
      return false
    }

    if (excludes.includes(projectName)) {
      return false
    }

    const alias: string[] = targets?.production?.alias || []
    if (!(Array.isArray(alias) && alias.length > 0)) {
      return false
    }

    if (!alias.some((link) => link.endsWith('.vercel.app'))) {
      return false
    }

    return true
  })

  return vercels.map(({ name: projectName, targets }) => {
    const name = formatProjectName(projectName)
    const alias: string[] = targets?.production?.alias || []
    const link = alias?.reduce((shortest, current) => {
      return current.length < shortest?.length ? current : shortest
    })

    return { name, link: `//${link}` }
  })
}
