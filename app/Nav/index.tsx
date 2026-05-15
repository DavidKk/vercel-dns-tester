'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { FiGithub, FiLogOut, FiUser } from 'react-icons/fi'

import { useLayoutVisibility } from '@/hooks/useLayoutVisibility'
import { name, repository } from '@/package.json'
import type { AuthUser } from '@/services/auth/access'

import { DEFAULT_NAV } from './constants'

interface NavItem {
  name: string
  href: string
}

interface NavProps {
  title?: string
  nav?: Record<string, NavItem[]>
  user?: AuthUser | null
}

const DEFAULT_TITLE = name.replace('vercel', '').split('-').join(' ')
const GITHUB_URL = repository.url

export function Nav(props: NavProps) {
  const { title = DEFAULT_TITLE, nav = DEFAULT_NAV, user: initialUser = null } = props
  const shouldHide = useLayoutVisibility()
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(initialUser)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setUser(initialUser)
  }, [initialUser])

  useEffect(() => {
    let ignore = false

    async function syncUser() {
      const response = await fetch('/api/auth', { cache: 'no-store' })
      if (!response.ok) {
        return
      }

      const result = await response.json()
      const nextUser = result?.data?.user ?? null
      if (!ignore) {
        setUser(nextUser)
      }
    }

    syncUser()

    return () => {
      ignore = true
    }
  }, [pathname])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' })
    setUser(null)
    setIsUserMenuOpen(false)
    router.refresh()
  }

  if (shouldHide) {
    return null
  }

  return (
    <nav className="z-40 w-full shrink-0 border-b border-app-border bg-app-surface/95 text-app-text shadow-sm shadow-app-border/60 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 md:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <Link className="group flex min-w-0 items-center gap-3" href="/" aria-label="DNS Tester home">
            <Image src="/favicon/favicon-96x96.png" alt="" width={36} height={36} className="h-9 w-9 shrink-0 rounded-md shadow-sm transition group-hover:opacity-90" priority />
            <span className="min-w-0">
              <span className="block truncate text-xl font-semibold leading-6 text-app-text">{title}</span>
            </span>
          </Link>

          <div className="order-3 flex w-full flex-wrap items-center gap-1 md:order-none md:ml-8 md:w-auto">
            {Object.entries(nav).map(([group, items]) => (
              <div className="flex flex-wrap items-center gap-1" key={group}>
                {items.map(({ name, href }) => {
                  const isActive = pathname === href

                  return (
                    <Link
                      className={`relative px-3 py-2 text-sm font-medium transition-colors after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:transition-opacity ${
                        isActive ? 'text-app-accent after:bg-app-accent after:opacity-100' : 'text-app-muted after:bg-transparent after:opacity-0 hover:text-app-accent'
                      }`}
                      href={href}
                      key={href}
                    >
                      {name}
                    </Link>
                  )
                })}
              </div>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((value) => !value)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-app-border text-app-muted transition-colors hover:bg-app-subtle hover:text-app-text"
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="menu"
                  aria-label="Open account menu"
                >
                  <FiUser size={18} />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-lg border border-app-border bg-app-surface shadow-lg" role="menu">
                    <div className="border-b border-app-border px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-app-muted">Signed in as</p>
                      <p className="mt-1 truncate text-sm font-semibold text-app-text">{user.username}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-app-danger transition hover:bg-app-dangerSoft"
                      role="menuitem"
                    >
                      <FiLogOut size={16} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                className={`inline-flex h-10 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors ${
                  pathname === '/login'
                    ? 'border-app-accent bg-app-accent text-white'
                    : 'border-app-border text-app-muted hover:border-app-accent/40 hover:bg-app-accentSoft hover:text-app-accent'
                }`}
                href="/login"
              >
                Login
              </Link>
            )}

            {GITHUB_URL && (
              <a
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-app-border text-app-muted transition-colors hover:border-app-border hover:bg-app-subtle hover:text-app-text"
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="Open GitHub repository"
              >
                <FiGithub size={18} />
              </a>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
