import type { Metadata } from 'next'
import type { ReactElement } from 'react'

export interface MetaProps {
  title?: string | ReactElement
  description?: string
}

export function generate(metaProps: MetaProps) {
  const { title, description } = metaProps
  const titleStr = typeof title === 'string' ? title : ''
  const keywords = [...new Set([...titleStr.toLowerCase().split(/\s+/).filter(Boolean), ...(description?.toLowerCase().split(/\s+/).filter(Boolean) || [])])].filter(
    (word) => word.length > 2
  )

  const metadata: Metadata = {
    title: titleStr,
    description,
    keywords: keywords.join(', '),
    openGraph: {
      title: titleStr,
      description,
    },
    twitter: {
      title: titleStr,
      description,
    },
  }

  const generateMetadata = () => metadata
  return { generateMetadata, metaProps }
}

export default function Meta(props: MetaProps) {
  const { title, description } = props

  return (
    <>
      <h1 className="text-2xl font-bold flex items-center gap-2">{title}</h1>
      <p className="text-gray-700">{description}</p>
    </>
  )
}
