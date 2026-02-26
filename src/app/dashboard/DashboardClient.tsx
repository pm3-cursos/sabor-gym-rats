'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'

// ─── Level system ────────────────────────────────────────────────────────────

function getUserLevel(aulaCount: number, total: number) {
  if (total > 0 && aulaCount >= total) return { label: 'Maratonista PM3', icon: '🥇', color: 'text-yellow-400' }
  if (aulaCount >= 3) return { label: 'Corredor', icon: '🥈', color: 'text-gray-300' }
  if (aulaCount >= 1) return { label: 'Iniciante', icon: '🥉', color: 'text-amber-500' }
  return { label: 'Na largada', icon: '🏁', color: 'text-gray-500' }
}

// ─── Email verification banner ────────────────────────────────────────────────

function EmailVerificationBanner() {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function resend() {
    setSending(true)
    await fetch('/api/auth/reenviar-verificacao', { method: 'POST' })
    setSending(false)
    setSent(true)
  }

  return (
    <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
      <p className="text-amber-400 text-sm">
        📬 Confirme seu e-mail para ativar sua conta. Verifique sua caixa de entrada.
      </p>
      {sent ? (
        <span className="text-emerald-400 text-xs shrink-0">E-mail reenviado ✓</span>
      ) : (
        <button
          onClick={resend}
          disabled={sending}
          className="text-amber-400 hover:text-amber-300 text-xs underline shrink-0 disabled:opacity-50"
        >
          {sending ? 'Enviando...' : 'Reenviar e-mail'}
        </button>
      )}
    </div>
  )
}

// ─── Celebration overlay ─────────────────────────────────────────────────────

function CelebrationOverlay({ userName, onClose }: { userName: string; onClose: () => void }) {
  const shareText = encodeURIComponent(
    `Acabei de completar a PM3 Marathon! 🏋️🥇\nAssisti a todas as aulas da série PM3, publiquei meus insights no LinkedIn e cruzei a linha de chegada!\n#ProductRats #MaratonaPM3 #ProductManagement`,
  )
  const shareUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${shareText}`

  useEffect(() => {
    const duration = 3000
    const end = Date.now() + duration
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 } })
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 } })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="card p-8 max-w-sm w-full text-center space-y-5">
        <div className="text-6xl">🎉</div>
        <h2 className="text-2xl font-bold">Você cruzou a linha de chegada!</h2>
        <p className="text-gray-400">
          Parabéns, {userName}! Você completou a <strong className="text-white">PM3 Marathon</strong> e está apto a concorrer ao prêmio.
        </p>
        <div className="flex flex-col gap-3">
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-center block"
          >
            Compartilhar conquista no LinkedIn
          </a>
          <button onClick={onClose} className="btn-secondary">
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Live {
  id: string
  title: string
  description: string | null
  scheduledAt: string | null
  order: number
  isActive: boolean
}

interface CheckIn {
  id: string
  liveId: string
  type: string
  linkedinUrl: string | null
  insight: string | null
  status: string
  adminNote: string | null
  createdAt: string
}

interface Props {
  userName: string
  emailVerified: boolean
  lives: Live[]
  checkIns: CheckIn[]
  approvedCount: number
  totalLives: number
  userRank: number
  totalParticipants: number
  nextLiveId: string | null
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DashboardClient({
  userName,
  emailVerified,
  lives,
  checkIns,
  approvedCount,
  totalLives,
  userRank,
  totalParticipants,
  nextLiveId,
}: Props) {
  const router = useRouter()
  // submitting key: `${liveId}_AULA` or `${liveId}_LINKEDIN`
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [insights, setInsights] = useState<Record<string, string>>({})
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [aulaErrors, setAulaErrors] = useState<Record<string, string>>({})
  const [linkedinErrors, setLinkedinErrors] = useState<Record<string, string>>({})
  const [aulaSuccess, setAulaSuccess] = useState<Record<string, boolean>>({})
  const [linkedinSuccess, setLinkedinSuccess] = useState<Record<string, boolean>>({})
  const [showCelebration, setShowCelebration] = useState(false)

  const level = getUserLevel(approvedCount, totalLives)
  const safeTotal = totalLives > 0 ? totalLives : 1
  const pct = Math.min(100, Math.round((approvedCount / safeTotal) * 100))
  const remaining = totalLives - approvedCount

  useEffect(() => {
    if (
      totalLives > 0 &&
      approvedCount >= totalLives &&
      !localStorage.getItem('pm3-celebration-shown')
    ) {
      setShowCelebration(true)
      localStorage.setItem('pm3-celebration-shown', '1')
    }
  }, [approvedCount, totalLives])

  const aulaCheckInMap: Record<string, CheckIn> = {}
  const linkedinCheckInMap: Record<string, CheckIn> = {}
  for (const c of checkIns) {
    if (c.type === 'AULA') aulaCheckInMap[c.liveId] = c
    else if (c.type === 'LINKEDIN') linkedinCheckInMap[c.liveId] = c
  }

  async function handleSubmit(liveId: string, type: 'AULA' | 'LINKEDIN') {
    const key = `${liveId}_${type}`
    const insight = insights[liveId]?.trim()
    const url = urls[liveId]?.trim()

    if (type === 'AULA') {
      if (!insight || insight.length < 10) {
        setAulaErrors((prev) => ({ ...prev, [liveId]: 'Escreva seu insight (mínimo 10 caracteres).' }))
        return
      }
      setAulaErrors((prev) => ({ ...prev, [liveId]: '' }))
    } else {
      if (!url || !url.includes('linkedin.com')) {
        setLinkedinErrors((prev) => ({ ...prev, [liveId]: 'Cole o link da sua publicação no LinkedIn.' }))
        return
      }
      setLinkedinErrors((prev) => ({ ...prev, [liveId]: '' }))
    }

    setSubmitting(key)

    const body: Record<string, string> = { liveId, type }
    if (type === 'AULA') body.insight = insight!
    else body.linkedinUrl = url!

    const res = await fetch('/api/checkins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    setSubmitting(null)

    if (!res.ok) {
      if (type === 'AULA') setAulaErrors((prev) => ({ ...prev, [liveId]: data.error || 'Erro ao enviar.' }))
      else setLinkedinErrors((prev) => ({ ...prev, [liveId]: data.error || 'Erro ao enviar.' }))
      return
    }

    if (type === 'AULA') {
      setAulaSuccess((prev) => ({ ...prev, [liveId]: true }))
      setInsights((prev) => ({ ...prev, [liveId]: '' }))
    } else {
      setLinkedinSuccess((prev) => ({ ...prev, [liveId]: true }))
      setUrls((prev) => ({ ...prev, [liveId]: '' }))
    }
    router.refresh()
  }

  function buildLinkedInShareUrl(liveTitle: string, insight: string) {
    const text = encodeURIComponent(
      `Acabei de assistir "${liveTitle}" da série PM3! 🏋️\n${insight ? insight + '\n' : ''}#ProductRats #MaratonaPM3 #ProductManagement`,
    )
    return `https://www.linkedin.com/feed/?shareActive=true&text=${text}`
  }

  const closeCelebration = useCallback(() => setShowCelebration(false), [])

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {showCelebration && <CelebrationOverlay userName={userName} onClose={closeCelebration} />}

      {!emailVerified && <EmailVerificationBanner />}

      {/* Header */}
      <div className="mb-8">
        <div className={`text-sm font-semibold mb-1 ${level.color}`}>
          {level.icon} {level.label}
        </div>
        <h1 className="text-2xl font-bold mb-1">Olá, {userName}!</h1>
        {totalParticipants > 0 && userRank > 0 && (
          <p className="text-gray-400 text-sm">
            Você está em{' '}
            <span className="text-white font-semibold">#{userRank}</span> de{' '}
            <span className="text-white font-semibold">{totalParticipants}</span> participantes
          </p>
        )}
      </div>

      {/* Progress card */}
      <div className="card p-5 mb-8">
        <h2 className="font-semibold text-gray-300 mb-4">Seu progresso na PM3 Marathon</h2>
        <div className="flex items-end gap-3 mb-4">
          <span
            className={`text-5xl font-bold tabular-nums ${
              approvedCount >= totalLives && totalLives > 0 ? 'text-emerald-400' : 'text-violet-400'
            }`}
          >
            {approvedCount}
          </span>
          <span className="text-gray-500 text-lg mb-1">de {totalLives} aulas</span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden mb-3">
          <div
            className={`h-full rounded-full transition-all duration-700 delay-100 ${
              approvedCount >= totalLives && totalLives > 0
                ? 'bg-emerald-500'
                : 'bg-gradient-to-r from-violet-600 to-violet-400'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {totalLives > 0 && approvedCount >= totalLives ? (
          <p className="text-emerald-400 text-sm font-medium text-center">
            🏆 Parabéns! Você completou a PM3 Marathon e está apto a concorrer ao prêmio!
          </p>
        ) : remaining > 0 ? (
          <p className="text-gray-500 text-xs text-center">
            Faltam {remaining} {remaining === 1 ? 'aula' : 'aulas'} para cruzar a linha de chegada 🏁
          </p>
        ) : null}
      </div>

      {/* Lives list */}
      <div className="space-y-4">
        <h2 className="font-semibold text-gray-300">Aulas</h2>

        {lives.length === 0 && (
          <div className="card p-8 text-center text-gray-600">
            <div className="text-4xl mb-3">👀</div>
            <p>As aulas começam em breve. Fique de olho!</p>
          </div>
        )}

        {lives.map((live) => {
          const aulaCI = aulaCheckInMap[live.id]
          const linkedinCI = linkedinCheckInMap[live.id]
          const aulaApproved = aulaCI?.status === 'APPROVED'
          const aulaPending = aulaCI?.status === 'PENDING'
          const aulaRejected = aulaCI?.status === 'REJECTED'
          const canSubmitAula = live.isActive && (!aulaCI || aulaRejected)
          const canSubmitLinkedin = live.isActive && (!linkedinCI || linkedinCI.status === 'REJECTED')
          const isNext = live.id === nextLiveId

          const insightValue = insights[live.id] || ''
          const insightLen = insightValue.trim().length
          const insightValid = insightLen >= 10
          const urlValue = urls[live.id] || ''

          let cardClass = 'card p-5'
          if (aulaApproved) cardClass += ' bg-emerald-500/5 border-emerald-800/30'
          else if (!live.isActive && !aulaCI) cardClass += ' opacity-60'
          else if (isNext) cardClass += ' border-violet-800/50'

          return (
            <div key={live.id} className={`${cardClass} card-hover`}>
              {/* Card header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                      aulaApproved
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : aulaRejected
                        ? 'bg-red-500/20 text-red-400'
                        : aulaPending
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-gray-800 text-gray-500'
                    }`}
                  >
                    {aulaApproved ? '✓' : live.order}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-sm leading-snug">{live.title}</p>
                    {live.scheduledAt && (
                      <p className="text-xs text-gray-600 mt-0.5">
                        {new Date(live.scheduledAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          weekday: 'short',
                        })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="shrink-0 flex gap-1 flex-wrap justify-end">
                  {!aulaCI && !live.isActive && (
                    <span className="text-xs text-gray-600">🔒 Em breve</span>
                  )}
                  {isNext && !aulaCI && (
                    <span className="text-xs bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full font-medium">
                      Próxima
                    </span>
                  )}
                </div>
              </div>

              {/* AULA section */}
              <div className="border border-gray-800 rounded-lg p-4 mb-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Aula · 1 pt
                  </span>
                  <div className="flex gap-1">
                    {aulaApproved && <span className="badge-approved">✓ Aprovado</span>}
                    {aulaPending && <span className="badge-pending">⏳ Revisão</span>}
                    {aulaRejected && <span className="badge-rejected">✗ Rejeitado</span>}
                  </div>
                </div>

                {(aulaPending || aulaApproved) && aulaCI?.insight && (
                  <blockquote className="text-sm text-gray-300 bg-gray-800/60 rounded-lg px-4 py-3 border-l-2 border-violet-500/40 italic mb-3">
                    "{aulaCI.insight}"
                  </blockquote>
                )}

                {aulaRejected && aulaCI?.adminNote && (
                  <div className="mb-3 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    <p className="text-xs text-red-400">
                      <strong>Nota do admin:</strong> {aulaCI.adminNote}
                    </p>
                  </div>
                )}

                {canSubmitAula && !aulaSuccess[live.id] && (
                  <div className="space-y-2">
                    {aulaRejected && (
                      <p className="text-xs text-amber-400">Seu check-in foi rejeitado. Envie novamente:</p>
                    )}
                    <div>
                      <textarea
                        className="input text-sm resize-none w-full"
                        rows={3}
                        placeholder="O que você aprendeu? Mínimo 10 caracteres..."
                        value={insightValue}
                        onChange={(e) =>
                          setInsights((prev) => ({ ...prev, [live.id]: e.target.value }))
                        }
                      />
                      <div
                        className={`text-xs mt-1 text-right tabular-nums ${
                          insightLen === 0
                            ? 'text-gray-600'
                            : insightValid
                            ? 'text-emerald-400'
                            : 'text-red-400'
                        }`}
                      >
                        {insightLen} / 10 mín.
                      </div>
                    </div>
                    {aulaErrors[live.id] && (
                      <p className="text-xs text-red-400">{aulaErrors[live.id]}</p>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleSubmit(live.id, 'AULA')}
                        disabled={submitting === `${live.id}_AULA` || !insightValid}
                        className="btn-primary text-sm flex-1"
                      >
                        {submitting === `${live.id}_AULA` ? 'Enviando...' : 'Check-in de Aula ✓'}
                      </button>
                      <a
                        href={buildLinkedInShareUrl(live.title, insightValue)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary text-sm text-center shrink-0"
                      >
                        Compartilhar →
                      </a>
                    </div>
                  </div>
                )}

                {aulaSuccess[live.id] && (
                  <p className="text-sm text-emerald-400">
                    🏃 Check-in enviado! Aguarde a aprovação.
                  </p>
                )}

                {aulaApproved && aulaCI && (
                  <a
                    href={buildLinkedInShareUrl(live.title, aulaCI.insight || '')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-violet-400 hover:text-violet-300 underline"
                  >
                    Compartilhar no LinkedIn →
                  </a>
                )}
              </div>

              {/* LINKEDIN section — only show when live is active or already has a check-in */}
              {(live.isActive || linkedinCI) && (
                <div className="border border-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      LinkedIn · 3 pts
                    </span>
                    <div className="flex gap-1">
                      {linkedinCI?.status === 'APPROVED' && <span className="badge-approved">✓ Aprovado</span>}
                      {linkedinCI?.status === 'PENDING' && <span className="badge-pending">⏳ Revisão</span>}
                      {linkedinCI?.status === 'REJECTED' && <span className="badge-rejected">✗ Rejeitado</span>}
                    </div>
                  </div>

                  {(linkedinCI?.status === 'PENDING' || linkedinCI?.status === 'APPROVED') &&
                    linkedinCI?.linkedinUrl && (
                      <div className="text-xs text-gray-500 bg-gray-800/40 rounded-lg px-3 py-2 mb-3">
                        <a
                          href={linkedinCI.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-violet-400 hover:text-violet-300 break-all"
                        >
                          {linkedinCI.linkedinUrl}
                        </a>
                      </div>
                    )}

                  {linkedinCI?.status === 'REJECTED' && linkedinCI?.adminNote && (
                    <div className="mb-3 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                      <p className="text-xs text-red-400">
                        <strong>Nota do admin:</strong> {linkedinCI.adminNote}
                      </p>
                    </div>
                  )}

                  {canSubmitLinkedin && !linkedinSuccess[live.id] && (
                    <div className="space-y-2">
                      {linkedinCI?.status === 'REJECTED' && (
                        <p className="text-xs text-amber-400">Seu check-in foi rejeitado. Envie novamente:</p>
                      )}
                      <input
                        type="url"
                        className="input text-sm w-full"
                        placeholder="https://www.linkedin.com/posts/..."
                        value={urlValue}
                        onChange={(e) =>
                          setUrls((prev) => ({ ...prev, [live.id]: e.target.value }))
                        }
                      />
                      {linkedinErrors[live.id] && (
                        <p className="text-xs text-red-400">{linkedinErrors[live.id]}</p>
                      )}
                      <button
                        onClick={() => handleSubmit(live.id, 'LINKEDIN')}
                        disabled={submitting === `${live.id}_LINKEDIN` || !urlValue.trim()}
                        className="btn-secondary text-sm w-full"
                      >
                        {submitting === `${live.id}_LINKEDIN`
                          ? 'Enviando...'
                          : 'Enviar publicação LinkedIn (+3 pts)'}
                      </button>
                    </div>
                  )}

                  {linkedinSuccess[live.id] && (
                    <p className="text-sm text-emerald-400">
                      🎯 Publicação enviada! Aguarde a aprovação.
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
