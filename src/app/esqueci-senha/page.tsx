'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/auth/esqueci-senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    setLoading(false)

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Erro ao processar.')
      return
    }

    setSent(true)
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔑</div>
          <h1 className="text-2xl font-bold">Esqueci minha senha</h1>
          <p className="text-gray-400 text-sm mt-1">PM3 Gymrats</p>
        </div>

        {sent ? (
          <div className="card p-6 text-center space-y-4">
            <div className="text-4xl">📬</div>
            <p className="text-gray-300">
              Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha em breve.
            </p>
            <p className="text-gray-500 text-sm">Verifique também sua caixa de spam.</p>
            <Link href="/login" className="btn-secondary block w-full text-center mt-2">
              Voltar ao login
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="card p-6 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              <p className="text-gray-400 text-sm">
                Informe seu e-mail e enviaremos um link para redefinir sua senha.
              </p>
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
              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading ? 'Enviando...' : 'Enviar link'}
              </button>
            </form>
            <p className="text-center text-sm text-gray-500 mt-5">
              <Link href="/login" className="text-violet-400 hover:text-violet-300">
                Voltar ao login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
