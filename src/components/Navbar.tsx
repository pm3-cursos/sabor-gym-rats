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
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg shrink-0">
          <span className="text-2xl">🐀</span>
          <span className="text-white">Product<span className="text-violet-400">Rats</span></span>
        </Link>

        {/* Center nav links */}
        <div className="flex items-center gap-4 overflow-x-auto">
          {navLink('/ranking', 'Ranking')}
          {navLink('/feed', 'Feed')}
          {user && navLink('/meu-progresso', 'Meu Progresso')}
          {user && navLink('/dashboard', 'Check-ins')}
          {user?.role === 'ADMIN' && navLink('/admin', 'Admin')}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0">
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
