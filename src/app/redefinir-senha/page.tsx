'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function RedefinirSenhaForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
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
        <input
          type="password"
          className="input"
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirmar senha</label>
        <input
          type="password"
          className="input"
          placeholder="Repita a senha"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          autoComplete="new-password"
        />
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
