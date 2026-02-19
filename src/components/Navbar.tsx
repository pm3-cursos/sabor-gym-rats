'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface NavbarProps {
  user: { name: string; role: string } | null
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-2xl">🏋️</span>
          <span className="text-white">PM3 <span className="text-violet-400">Gymrats</span></span>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Meus check-ins
              </Link>
              {user.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="text-sm text-violet-400 hover:text-violet-300 transition-colors font-medium"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={handleLogout}
                disabled={loading}
                className="text-sm text-gray-500 hover:text-red-400 transition-colors"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
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
