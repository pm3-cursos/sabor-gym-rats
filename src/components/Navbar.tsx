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
        {/* Left: nav links */}
        <div className="flex items-center gap-4 overflow-x-auto">
          {navLink('/ranking', 'Ranking')}
          {navLink('/feed', 'Feed')}
          {user && navLink('/meu-progresso', 'Progresso')}
          {user && navLink('/dashboard', 'Check-ins')}
          {user?.role === 'ADMIN' && navLink('/admin', 'Admin')}
        </div>

        {/* Center: logo */}
        <div className="flex justify-center">
          <Link href="/" aria-label="ProductRats — Maratona PM3">
            <svg width="130" height="38" viewBox="0 0 130 38" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="pm3g" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#7C3AED" />
                  <stop offset="100%" stopColor="#F97066" />
                </linearGradient>
              </defs>
              {/* Brand mark: gradient rounded rect */}
              <rect x="0" y="3" width="32" height="32" rx="8" fill="url(#pm3g)" />
              {/* "M" monogram inside brand mark */}
              <text x="16" y="24" textAnchor="middle" fill="white" fontSize="16" fontWeight="700" fontFamily="system-ui, sans-serif">M</text>
              {/* "Maratona" label */}
              <text x="42" y="16" fill="#D1D5DB" fontSize="9" fontWeight="400" fontFamily="system-ui, sans-serif" letterSpacing="0.05em">MARATONA</text>
              {/* "PM3" main text */}
              <text x="41" y="33" fill="white" fontSize="19" fontWeight="700" fontFamily="system-ui, sans-serif">PM3</text>
            </svg>
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
