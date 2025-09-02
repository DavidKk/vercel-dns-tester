import type { Metadata } from 'next'
import type { ReactElement, ReactNode } from 'react'

export interface MetaProps {
  title?: string | ReactElement
  description?: string
  linkAliases?: Record<string, string>
  children?: ReactNode
}

// Function to convert URLs in text to clickable links
function convertUrlsToLinks(text: string, linkAliases: Record<string, string> = {}): ReactNode {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts = text.split(urlRegex)

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      const alias = linkAliases[part] || part
      return (
        <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
          {alias}
        </a>
      )
    }
    return part
  })
}

export function generate(metaProps: MetaProps) {
  const { title, description } = metaProps
  const titleStr = typeof title === 'string' ? title : ''
  // Use description as is for metadata (plain text)
  const descriptionStr = typeof description === 'string' ? description : ''

  const keywords = [...new Set([...titleStr.toLowerCase().split(/\s+/).filter(Boolean), ...(descriptionStr.toLowerCase().split(/\s+/).filter(Boolean) || [])])].filter(
    (word) => word.length > 2
  )

  const metadata: Metadata = {
    title: titleStr,
    description: descriptionStr,
    keywords: keywords.join(', '),
    openGraph: {
      title: titleStr,
      description: descriptionStr,
    },
    twitter: {
      title: titleStr,
      description: descriptionStr,
    },
  }

  const generateMetadata = () => metadata
  return { generateMetadata, metaProps }
}

export default function Meta(props: MetaProps) {
  const { title, description, linkAliases = {}, children } = props

  return (
    <>
      <h1 className="text-2xl font-bold flex items-center gap-2">{title}</h1>
      <p className="text-gray-700">{typeof description === 'string' ? convertUrlsToLinks(description, linkAliases) : description}</p>
      {children}
    </>
  )
}
