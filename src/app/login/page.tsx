'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isBanned, setIsBanned] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setIsBanned(res.status === 403)
      setError(data.error || 'Erro ao entrar.')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏋️</div>
          <h1 className="text-2xl font-bold">Entrar</h1>
          <p className="text-gray-400 text-sm mt-1">ProductRats — Maratona PM3</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {error && (
            <div className={`border text-sm px-4 py-3 rounded-lg ${isBanned ? 'bg-red-900/20 border-red-500/40 text-red-300' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
              {isBanned && <p className="font-semibold mb-0.5">Conta suspensa</p>}
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">E-mail</label>
            <input
              type="email"
              className="input"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Senha</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <p className="text-center text-sm">
            <Link href="/esqueci-senha" className="text-gray-500 hover:text-violet-400 transition-colors">
              Esqueci minha senha
            </Link>
          </p>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Ainda não tem conta?{' '}
          <Link href="/cadastro" className="text-violet-400 hover:text-violet-300">
            Cadastrar
          </Link>
        </p>
      </div>
    </div>
  )
}
