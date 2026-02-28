'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PerfilClient({
  currentLinkedinUrl,
  userName,
  userEmail,
}: {
  currentLinkedinUrl: string | null
  userName: string
  userEmail: string
}) {
  const router = useRouter()
  const [linkedinUrl, setLinkedinUrl] = useState(currentLinkedinUrl || '')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    const trimmed = linkedinUrl.trim()
    if (trimmed && !trimmed.includes('linkedin.com/')) {
      setError('URL inválida. Deve conter "linkedin.com/".')
      return
    }

    setLoading(true)
    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ linkedinProfileUrl: trimmed || null }),
    })
    setLoading(false)

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Erro ao salvar.')
      return
    }

    setSuccess(true)
    router.refresh()
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Meu Perfil</h1>
          <p className="text-gray-400 text-sm mt-1">{userName} · {userEmail}</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm px-4 py-3 rounded-lg">
              ✓ Perfil atualizado com sucesso!
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Perfil do LinkedIn <span className="text-gray-500 font-normal">(opcional)</span>
            </label>
            <input
              type="url"
              className="input"
              placeholder="https://linkedin.com/in/seu-perfil"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              autoComplete="url"
            />
            <p className="text-xs text-gray-600 mt-1.5">
              Necessário para ganhar o bônus de +3 pts por publicação LinkedIn nas aulas.
            </p>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </form>
      </div>
    </div>
  )
}
