'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Live {
  id: string
  title: string
  description: string | null
  scheduledAt: Date | null
  order: number
  isActive: boolean
}

interface CheckIn {
  id: string
  liveId: string
  linkedinUrl: string
  status: string
  adminNote: string | null
  createdAt: string
}

interface Props {
  userName: string
  lives: Live[]
  checkIns: CheckIn[]
  approvedCount: number
}

export default function DashboardClient({ userName, lives, checkIns, approvedCount }: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState<Record<string, boolean>>({})

  const checkInMap: Record<string, CheckIn> = {}
  for (const c of checkIns) {
    checkInMap[c.liveId] = c
  }

  const pct = Math.round((approvedCount / 8) * 100)

  async function handleSubmit(liveId: string) {
    const url = urls[liveId]?.trim()
    if (!url) {
      setErrors((prev) => ({ ...prev, [liveId]: 'Cole o link da sua publicação no LinkedIn.' }))
      return
    }

    setSubmitting(liveId)
    setErrors((prev) => ({ ...prev, [liveId]: '' }))

    const res = await fetch('/api/checkins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ liveId, linkedinUrl: url }),
    })

    const data = await res.json()
    setSubmitting(null)

    if (!res.ok) {
      setErrors((prev) => ({ ...prev, [liveId]: data.error || 'Erro ao enviar.' }))
      return
    }

    setSuccess((prev) => ({ ...prev, [liveId]: true }))
    setUrls((prev) => ({ ...prev, [liveId]: '' }))
    router.refresh()
  }

  function statusBadge(status: string) {
    if (status === 'APPROVED') return <span className="badge-approved">✓ Aprovado</span>
    if (status === 'REJECTED') return <span className="badge-rejected">✗ Rejeitado</span>
    return <span className="badge-pending">⏳ Aguardando revisão</span>
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Olá, {userName}! 👋</h1>
        <p className="text-gray-400 text-sm">Acompanhe seus check-ins no desafio PM3 Gymrats</p>
      </div>

      {/* Progress */}
      <div className="card p-5 mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold">Seu progresso</span>
          <span className={`font-bold text-lg ${approvedCount >= 8 ? 'text-emerald-400' : 'text-violet-400'}`}>
            {approvedCount}/8
          </span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              approvedCount >= 8 ? 'bg-emerald-500' : 'bg-violet-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {approvedCount >= 8 && (
          <p className="text-emerald-400 text-sm font-medium mt-3 text-center">
            🏆 Parabéns! Você completou todas as 8 lives e está apto a ganhar o prêmio!
          </p>
        )}
        {approvedCount > 0 && approvedCount < 8 && (
          <p className="text-gray-500 text-xs mt-2 text-center">
            Faltam {8 - approvedCount} {8 - approvedCount === 1 ? 'live' : 'lives'} para completar o desafio
          </p>
        )}
      </div>

      {/* Lives list */}
      <div className="space-y-4">
        <h2 className="font-semibold text-gray-300">Lives</h2>
        {lives.map((live) => {
          const checkIn = checkInMap[live.id]
          const isSubmitted = !!checkIn
          const canSubmit = live.isActive && (!checkIn || checkIn.status === 'REJECTED')
          const showSuccess = success[live.id]

          return (
            <div
              key={live.id}
              className={`card p-5 ${!live.isActive && !isSubmitted ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                    checkIn?.status === 'APPROVED'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : checkIn?.status === 'REJECTED'
                      ? 'bg-red-500/20 text-red-400'
                      : checkIn?.status === 'PENDING'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-gray-800 text-gray-500'
                  }`}>
                    {live.order}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-sm leading-snug">{live.title}</p>
                    {live.scheduledAt && (
                      <p className="text-xs text-gray-600 mt-0.5">
                        {new Date(live.scheduledAt).toLocaleDateString('pt-BR', {
                          day: '2-digit', month: 'short', weekday: 'short',
                        })}
                      </p>
                    )}
                  </div>
                </div>
                {isSubmitted && statusBadge(checkIn.status)}
                {!live.isActive && !isSubmitted && (
                  <span className="text-xs text-gray-600 shrink-0">Em breve</span>
                )}
              </div>

              {/* Existing check-in info */}
              {checkIn && (
                <div className="mt-2 mb-3 text-xs text-gray-500 bg-gray-800/50 rounded-lg p-3">
                  <a
                    href={checkIn.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-400 hover:text-violet-300 break-all"
                  >
                    {checkIn.linkedinUrl}
                  </a>
                  {checkIn.adminNote && (
                    <p className="mt-1 text-red-400">Nota do admin: {checkIn.adminNote}</p>
                  )}
                </div>
              )}

              {/* Submit form */}
              {canSubmit && !showSuccess && (
                <div className="space-y-2">
                  {checkIn?.status === 'REJECTED' && (
                    <p className="text-xs text-amber-400">Seu check-in foi rejeitado. Envie uma nova publicação:</p>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="url"
                      className="input text-sm flex-1"
                      placeholder="https://www.linkedin.com/posts/..."
                      value={urls[live.id] || ''}
                      onChange={(e) =>
                        setUrls((prev) => ({ ...prev, [live.id]: e.target.value }))
                      }
                    />
                    <button
                      onClick={() => handleSubmit(live.id)}
                      disabled={submitting === live.id}
                      className="btn-primary text-sm shrink-0"
                    >
                      {submitting === live.id ? '...' : 'Enviar'}
                    </button>
                  </div>
                  {errors[live.id] && (
                    <p className="text-xs text-red-400">{errors[live.id]}</p>
                  )}
                </div>
              )}

              {showSuccess && (
                <p className="text-sm text-emerald-400 mt-2">
                  ✓ Check-in enviado! Aguarde a aprovação do admin.
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
