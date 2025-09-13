import Link from 'next/link'
import FeatherIcon from 'feather-icons-react'
import { name, repository } from '@/package.json'
import { DEFAULT_NAV } from './constants'

interface NavItem {
  name: string
  href: string
}

interface NavProps {
  title?: string
  nav?: Record<string, NavItem[]>
}

const DEFAULT_TITLE = name.replace('vercel', '').split('-').join(' ')
const GITHUB_URL = repository.url

export function Nav(props: NavProps) {
  const { title = DEFAULT_TITLE, nav = DEFAULT_NAV } = props

  return (
    <nav className="w-full p-4 bg-indigo-500 text-white">
      <div className="container-md flex items-center justify-center md:justify-start flex-wrap md:flex-nowrap gap-y-2">
        <h1 className="text-xl font-bold text-center md:text-left">
          <Link className="whitespace-nowrap capitalize" href="/">
            {title}
          </Link>
        </h1>

        <div className="md:ml-8 flex">
          {Object.entries(nav).map(([hero, nav], index) => (
            <div className="group inline-flex flex-col relative px-2" key={index}>
              {!hero.startsWith('$') && (
                <span className="absolute left-0 right-0 transition-all opacity-[0] group-hover:opacity-[1] group-hover:translate-y-[-0.8rem] group-hover:scale-[0.6] inline-flex justify-center font-black text-center uppercase user-select-none pointer-events-none">
                  {hero}
                </span>
              )}

              <div className={`flex gap-2 flex-wrap transition-all ${hero.startsWith('$') ? '' : 'group-hover:translate-y-[0.5rem]'}`}>
                {nav.map(({ name, href }, index) => (
                  <Link className="whitespace-nowrap relative group/link" href={href} key={index}>
                    {name}
                    <span
                      className={`hidden md:block ${hero.startsWith('$') ? 'translate-y-[1.2rem]' : 'translate-y-[0.7rem]'} absolute inset-x-0 bottom-0 h-[2px] bg-white transition-all duration-300 transform scale-x-0 group-hover/link:scale-x-100`}
                    ></span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {GITHUB_URL && (
          <a className="ml-auto absolute top-4 right-4 md:static" href={GITHUB_URL} target="_blank" rel="noreferrer">
            <FeatherIcon icon="github" />
          </a>
        )}
      </div>
    </nav>
  )
}
