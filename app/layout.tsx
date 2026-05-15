import './globals.css'

import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import { getAuthUser } from '@/services/auth/access'

import { Nav } from './Nav'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'DoH Tester',
  description: 'DNS over HTTPS Server Tester',
  manifest: '/favicon/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon/favicon.ico', sizes: 'any' },
      { url: '/favicon/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: '/favicon/apple-touch-icon.png',
  },
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default async function RootLayout(props: Readonly<RootLayoutProps>) {
  const { children } = props
  const user = await getAuthUser()

  return (
    <html lang="en">
      <Analytics />
      <SpeedInsights />
      <body className={`${geistSans.variable} ${geistMono.variable} flex h-screen flex-col overflow-hidden antialiased`}>
        <Nav user={user} />
        {children}
      </body>
    </html>
  )
}
