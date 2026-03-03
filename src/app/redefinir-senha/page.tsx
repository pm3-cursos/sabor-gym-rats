'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

function RedefinirSenhaForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)

    const res = await fetch('/api/auth/redefinir-senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Erro ao redefinir senha.')
      return
    }

    setDone(true)
    setTimeout(() => router.push('/login'), 3000)
  }

  if (!token) {
    return (
      <div className="card p-6 text-center space-y-4">
        <p className="text-red-400">Link inválido ou incompleto.</p>
        <Link href="/esqueci-senha" className="btn-secondary block w-full text-center">
          Solicitar novo link
        </Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="card p-6 text-center space-y-4">
        <div className="text-4xl">✅</div>
        <p className="text-emerald-400 font-medium">Senha redefinida com sucesso!</p>
        <p className="text-gray-500 text-sm">Redirecionando para o login...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Nova senha</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            className="input pr-10"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirmar senha</label>
        <div className="relative">
          <input
            type={showConfirm ? 'text' : 'password'}
            className="input pr-10"
            placeholder="Repita a senha"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
            tabIndex={-1}
            aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
        {loading ? 'Salvando...' : 'Salvar nova senha'}
      </button>
    </form>
  )
}

export default function RedefinirSenhaPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔒</div>
          <h1 className="text-2xl font-bold">Nova senha</h1>
          <p className="text-gray-400 text-sm mt-1">ProductRats — Maratona PM3</p>
        </div>
        <Suspense fallback={<div className="card p-6 text-center text-gray-400">Carregando...</div>}>
          <RedefinirSenhaForm />
        </Suspense>
      </div>
    </div>
  )
}
