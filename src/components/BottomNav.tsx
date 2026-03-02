'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const BASE_LINKS = [
  { href: '/dashboard', label: 'Check-in', icon: '✅' },
  { href: '/meu-progresso', label: 'Progresso', icon: '📈' },
  { href: '/ranking', label: 'Ranking', icon: '🏆' },
  { href: '/feed', label: 'Feed', icon: '📰' },
]

export default function BottomNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname()
  const links = isAdmin
    ? [...BASE_LINKS, { href: '/admin', label: 'Admin', icon: '⚙️' }]
    : BASE_LINKS

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-950 border-t border-gray-800 pb-safe">
      <div className="flex h-14">
        {links.map((link) => {
          const active = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
                active ? 'text-violet-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <span className="text-base leading-none">{link.icon}</span>
              <span className="font-medium">{link.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
