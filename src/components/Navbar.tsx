'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import NotificationBell from './NotificationBell'

interface NavbarProps {
  user: { name: string; role: string } | null
  showRankingOnHome?: boolean
  showFeedOnHome?: boolean
}

export default function Navbar({ user, showRankingOnHome = false, showFeedOnHome = false }: NavbarProps) {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  function navLink(href: string, label: string) {
    const active = pathname === href
    return (
      <Link
        href={href}
        className={`text-sm whitespace-nowrap transition-colors px-3 py-1 rounded-lg ${
          active ? 'text-white font-medium bg-white/10' : 'text-gray-400 hover:text-white'
        }`}
      >
        {label}
      </Link>
    )
  }

  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Left: nav links — hidden on mobile/tablet (BottomNav handles it) */}
        <div className="hidden lg:flex items-center gap-1 bg-gray-900/60 border border-gray-700/40 rounded-xl px-2 py-1 shrink-0">
          {user && navLink('/dashboard', 'Check-in')}
          {user && navLink('/meu-progresso', 'Progresso')}
          {/* Ranking and Feed: always for logged-in users; on Home only if admin toggled on */}
          {(user || showRankingOnHome) && navLink('/ranking', 'Ranking')}
          {(user || showFeedOnHome) && navLink('/feed', 'Feed')}
          {user?.role === 'ADMIN' && navLink('/admin', 'Admin')}
        </div>

        {/* Center: logo — always centered */}
        <div className="flex-1 flex justify-center">
          <Link href={user ? '/dashboard' : '/'} aria-label="Maratona PM3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-pm3.svg" alt="Maratona PM3" className="h-9 w-auto" />
          </Link>
        </div>

        {/* Right: user actions */}
        <div className="flex items-center gap-3 shrink-0 justify-end">
          {user ? (
            <>
              <NotificationBell isLoggedIn={!!user} />
              <span className="hidden lg:block">{navLink('/indicacao', 'Indicar amigos')}</span>
              <span className="hidden lg:block">{navLink('/perfil', 'Perfil')}</span>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="hidden lg:inline text-sm text-gray-500 hover:text-red-400 transition-colors"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
                Entrar
              </Link>
              <Link href="/cadastro" className="btn-primary text-sm py-2 px-4">
                Cadastrar
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
