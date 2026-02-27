'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'

interface NavbarProps {
  user: { name: string; role: string } | null
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  function navLink(href: string, label: string) {
    const active = pathname === href
    return (
      <Link
        href={href}
        className={`text-sm transition-colors ${
          active ? 'text-white font-medium' : 'text-gray-400 hover:text-white'
        }`}
      >
        {label}
      </Link>
    )
  }

  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 grid grid-cols-3 items-center gap-2">
        {/* Left: nav links — hidden on mobile (BottomNav handles it) */}
        <div className="hidden md:flex items-center gap-4 overflow-x-auto">
          {user && navLink('/dashboard', 'Check-ins')}
          {user && navLink('/meu-progresso', 'Progresso')}
          {navLink('/ranking', 'Ranking')}
          {navLink('/feed', 'Feed')}
          {user?.role === 'ADMIN' && navLink('/admin', 'Admin')}
        </div>

        {/* Center: logo */}
        <div className="flex justify-center">
          <Link href={user ? '/dashboard' : '/'} aria-label="Maratona PM3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-pm3.svg" alt="Maratona PM3" className="h-9 w-auto" />
          </Link>
        </div>

        {/* Right: user actions */}
        <div className="flex items-center gap-3 justify-end">
          {user ? (
            <button
              onClick={handleLogout}
              disabled={loading}
              className="text-sm text-gray-500 hover:text-red-400 transition-colors"
            >
              Sair
            </button>
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
