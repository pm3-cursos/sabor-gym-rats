'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import { getUserLevel, getAdditionalBadges } from '@/lib/points'

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000)
    return () => clearTimeout(t)
  }, [onDismiss])
  return (
    <div className="fixed bottom-28 md:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-sm px-5 py-2.5 rounded-full shadow-lg whitespace-nowrap">
      ✓ {message}
    </div>
  )
}

// ─── Edit check-in modal ──────────────────────────────────────────────────────

interface EditCheckIn {
  id: string
  type: string
  insight: string | null
  linkedinUrl: string | null
}

function EditCheckInModal({
  checkIn,
  onSave,
  onCancel,
  saving,
}: {
  checkIn: EditCheckIn
  onSave: (data: { insight?: string; linkedinUrl?: string }) => Promise<void>
  onCancel: () => void
  saving: boolean
}) {
  const [insight, setInsight] = useState(checkIn.insight || '')
  const [url, setUrl] = useState(checkIn.linkedinUrl || '')
  const [error, setError] = useState('')

  async function handleSave() {
    setError('')
    if (checkIn.type === 'AULA') {
      if (insight.trim().length < 10) {
        setError('Mínimo 10 caracteres.')
        return
      }
      try {
        await onSave({ insight: insight.trim() })
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar.')
      }
    } else {
      const trimmed = url.trim()
      if (!trimmed.startsWith('https://www.linkedin.com/') || !trimmed.includes('posts/')) {
        setError('Cole o link oficial do LinkedIn (linkedin.com/posts/).')
        return
      }
      try {
        await onSave({ linkedinUrl: trimmed })
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar.')
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="card p-6 max-w-md w-full space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Editar check-in</h3>
          <button onClick={onCancel} className="text-gray-500 hover:text-white transition-colors text-lg">✕</button>
        </div>
        {checkIn.type === 'AULA' ? (
          <div className="space-y-1">
            <label className="text-xs text-gray-400 block">Seu insight</label>
            <textarea
              className="input text-sm resize-none w-full"
              rows={4}
              placeholder="O que você aprendeu nesta aula? Qual foi o seu maior insight?"
              value={insight}
              onChange={(e) => setInsight(e.target.value)}
              autoFocus
            />
            <div
              className={`text-xs text-right tabular-nums ${
                insight.trim().length < 10 ? 'text-gray-600' : 'text-emerald-400'
              }`}
            >
              {insight.trim().length < 10
                ? `Faltam ${10 - insight.trim().length} caracteres`
                : `✓ ${insight.trim().length} caracteres`}
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <label className="text-xs text-gray-400 block">URL da publicação LinkedIn</label>
            <input
              type="url"
              className="input text-sm w-full"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.linkedin.com/posts/..."
              autoFocus
            />
          </div>
        )}
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
          <button onClick={onCancel} className="btn-secondary flex-1">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Confirm modal ────────────────────────────────────────────────────────────

function ConfirmModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="card p-6 max-w-sm w-full space-y-4">
        <h3 className="font-semibold">Remover check-in?</h3>
        <p className="text-sm text-gray-400">
          O check-in e os pontos correspondentes serão removidos permanentemente.
        </p>
        <div className="flex gap-3">
          <button onClick={onConfirm} className="btn-danger flex-1">
            Remover
          </button>
          <button onClick={onCancel} className="btn-secondary flex-1">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Recording modal ──────────────────────────────────────────────────────────

function RecordingModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h3 className="font-semibold text-sm truncate pr-4">🎥 {title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-lg shrink-0"
          >
            ✕
          </button>
        </div>
        <div className="p-1">
          <div className="aspect-video w-full bg-gray-950 rounded-lg overflow-hidden">
            <iframe
              src={url}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Celebration overlay ─────────────────────────────────────────────────────

function CelebrationOverlay({
  userName,
  userRank,
  onClose,
}: {
  userName: string
  userRank: number
  onClose: () => void
}) {
  const shareText = encodeURIComponent(
    `Acabei de completar a Maratona PM3! 🏋️🥇\nAssisti a todas as aulas, publiquei meus insights no LinkedIn e cruzei a linha de chegada!\n#MaratonaPM3 #ProductManagement`,
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
        <h2 className="text-2xl font-bold">Você cruzou a linha de chegada da Maratona PM3!</h2>
        <p className="text-gray-400">
          Parabéns, {userName}! Você completou todas as aulas e está apto a concorrer ao prêmio.
        </p>
        {userRank > 0 && (
          <p className="text-violet-400 font-semibold text-lg">
            Sua posição no ranking: #{userRank}
          </p>
        )}
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
  recordingUrl: string | null
}

interface CheckIn {
  id: string
  liveId: string
  type: string
  linkedinUrl: string | null
  insight: string | null
  status: string
  adminNote: string | null
  isInvalid: boolean
  createdAt: string
  updatedAt: string
}

interface Props {
  userName: string
  lives: Live[]
  checkIns: CheckIn[]
  approvedCount: number
  linkedinCount: number
  totalLives: number
  userRank: number
  totalParticipants: number
  userPoints: number
  nextLiveId: string | null
}

function getDaysUntil(scheduledAt: string | null): string {
  if (!scheduledAt) return 'Em breve'
  const now = new Date()
  const target = new Date(scheduledAt)
  const diffMs = target.getTime() - now.getTime()
  if (diffMs <= 0) return 'Encerrada'
  const diffHours = diffMs / (1000 * 60 * 60)
  if (diffHours < 24) return `Abre em ${Math.ceil(diffHours)}h`
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  return `Abre em ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`
}

function formatDate(isoStr: string) {
  return new Date(isoStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DashboardClient({
  userName,
  lives,
  checkIns,
  approvedCount,
  linkedinCount,
  totalLives,
  userRank,
  totalParticipants,
  userPoints,
  nextLiveId,
}: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [insights, setInsights] = useState<Record<string, string>>({})
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [aulaErrors, setAulaErrors] = useState<Record<string, string>>({})
  const [linkedinErrors, setLinkedinErrors] = useState<Record<string, string>>({})
  const [aulaSuccess, setAulaSuccess] = useState<Record<string, boolean>>({})
  const [linkedinSuccess, setLinkedinSuccess] = useState<Record<string, boolean>>({})
  const [showCelebration, setShowCelebration] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [recordingLiveId, setRecordingLiveId] = useState<string | null>(null)
  // Edit modal state
  const [editingCheckIn, setEditingCheckIn] = useState<EditCheckIn | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  // Delete confirm state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const level = getUserLevel(approvedCount)
  const additionalBadges = getAdditionalBadges(linkedinCount)
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

  useEffect(() => {
    const hash = window.location.hash
    if (!hash) return
    setTimeout(() => {
      document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }, [])

  useEffect(() => {
    if (approvedCount === 0 && !localStorage.getItem('pm3-onboarding-dismissed')) {
      setShowOnboarding(true)
    }
  }, [approvedCount])

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
      if (!url || !url.startsWith('https://www.linkedin.com/') || !url.includes('posts/')) {
        setLinkedinErrors((prev) => ({
          ...prev,
          [liveId]: 'Cole o link oficial de uma publicação do LinkedIn (linkedin.com/posts/).',
        }))
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
      const errMsg = data.error || 'Erro ao enviar.'
      if (type === 'AULA') setAulaErrors((prev) => ({ ...prev, [liveId]: errMsg }))
      else setLinkedinErrors((prev) => ({ ...prev, [liveId]: errMsg }))
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

  async function handleSaveEdit(data: { insight?: string; linkedinUrl?: string }) {
    if (!editingCheckIn) return
    setSubmitting(editingCheckIn.id)
    const res = await fetch(`/api/checkins/${editingCheckIn.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setSubmitting(null)
    if (!res.ok) {
      const json = await res.json()
      throw new Error(json.error || 'Erro ao salvar.')
    }
    setEditingCheckIn(null)
    setToastMsg('Check-in atualizado com sucesso!')
    router.refresh()
  }

  async function handleDeleteCheckIn(id: string) {
    setConfirmDeleteId(id)
  }

  async function confirmDelete() {
    if (!confirmDeleteId) return
    setSubmitting(confirmDeleteId)
    setConfirmDeleteId(null)
    await fetch(`/api/checkins/${confirmDeleteId}`, { method: 'DELETE' })
    setSubmitting(null)
    router.refresh()
  }

  const closeCelebration = useCallback(() => setShowCelebration(false), [])
  const recordingLive = recordingLiveId ? lives.find((l) => l.id === recordingLiveId) : null

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {showCelebration && (
        <CelebrationOverlay userName={userName} userRank={userRank} onClose={closeCelebration} />
      )}

      {recordingLive?.recordingUrl && (
        <RecordingModal
          url={recordingLive.recordingUrl}
          title={recordingLive.title}
          onClose={() => setRecordingLiveId(null)}
        />
      )}

      {confirmDeleteId && (
        <ConfirmModal
          onConfirm={confirmDelete}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      {editingCheckIn && (
        <EditCheckInModal
          checkIn={editingCheckIn}
          onSave={handleSaveEdit}
          onCancel={() => setEditingCheckIn(null)}
          saving={submitting === editingCheckIn.id}
        />
      )}

      {toastMsg && (
        <Toast message={toastMsg} onDismiss={() => setToastMsg(null)} />
      )}

      {/* Onboarding banner */}
      {showOnboarding && (
        <div className="card p-5 mb-6 border-violet-800/50 bg-violet-500/5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-2xl mb-1">👋</div>
              <h3 className="font-semibold mb-1">Bem-vindo à Maratona PM3!</h3>
              <p className="text-sm text-gray-400">
                Assista às aulas ao vivo, registre seu insight e ganhe pontos. Os 3 participantes com mais pontos vencem prêmios incríveis!
              </p>
            </div>
            <button
              onClick={() => {
                localStorage.setItem('pm3-onboarding-dismissed', '1')
                setShowOnboarding(false)
              }}
              className="text-gray-600 hover:text-white transition-colors shrink-0 text-lg"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className={`text-sm font-semibold mb-0.5 ${level.color}`}>
          {level.icon} {level.label}
        </div>
        {additionalBadges.map((b) => (
          <span key={b.label} className={`text-xs font-medium mr-2 ${b.color}`}>
            {b.icon} {b.label}
          </span>
        ))}
        <h1 className="text-2xl font-bold mb-1 mt-1">Olá, {userName}!</h1>
        {totalParticipants > 0 && userRank > 0 && (
          <p className="text-gray-400 text-sm">
            Você está em{' '}
            <span className="text-white font-semibold">#{userRank}</span> de{' '}
            <span className="text-white font-semibold">{totalParticipants}</span> participantes
            {' · '}
            <span className="text-violet-400 font-semibold">{userPoints} pts</span>
          </p>
        )}
      </div>

      {/* Progress card */}
      <div className="card p-5 mb-8">
        <h2 className="font-semibold text-gray-300 mb-4">Seu progresso na Maratona PM3</h2>
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
            🏆 Parabéns! Você completou a Maratona PM3 e está apto a concorrer ao prêmio!
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
          const aulaApproved = aulaCI?.status === 'APPROVED' && !aulaCI?.isInvalid
          const aulaInvalid = aulaCI?.status === 'APPROVED' && !!aulaCI?.isInvalid
          const aulaRejected = aulaCI?.status === 'REJECTED'
          const canSubmitAula = live.isActive && (!aulaCI || aulaRejected)
          const canSubmitLinkedin = live.isActive && aulaApproved && (!linkedinCI || linkedinCI.status === 'REJECTED')
          const isNext = live.id === nextLiveId

          const insightValue = insights[live.id] || ''
          const insightLen = insightValue.trim().length
          const insightValid = insightLen >= 10
          const urlValue = urls[live.id] || ''

          let cardClass = 'card p-5'
          if (aulaInvalid) cardClass += ' bg-amber-500/5 border-amber-800/30'
          else if (aulaApproved) cardClass += ' bg-emerald-500/5 border-emerald-800/30'
          else if (!live.isActive && !aulaCI) cardClass += ' opacity-60'
          else if (isNext) cardClass += ' border-violet-800/50'

          return (
            <div key={live.id} id={`live-${live.id}`} className={`${cardClass} card-hover`}>
              {/* Card header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                      aulaApproved
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : aulaRejected
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-gray-800 text-gray-500'
                    }`}
                  >
                    {aulaApproved ? '✓' : live.order}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-base leading-snug">{live.title}</p>
                    {live.description && (
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug">{live.description}</p>
                    )}
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
                    <span className="text-xs text-gray-600">🔒 {getDaysUntil(live.scheduledAt)}</span>
                  )}
                  {isNext && !aulaCI && (
                    <span className="text-xs bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full font-medium">
                      Próxima
                    </span>
                  )}
                </div>
              </div>

              {/* AULA section */}
              <div className="border border-violet-800/50 bg-violet-500/5 rounded-lg p-4 mb-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
                    🏁 Aula: +1 ponto
                  </span>
                  <div className="flex gap-1">
                    {aulaApproved && <span className="badge-approved">✓ Registrado</span>}
                    {aulaInvalid && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full">
                        ⚠️ Invalidado
                      </span>
                    )}
                    {aulaRejected && <span className="badge-rejected">✗ Rejeitado</span>}
                  </div>
                </div>

                {aulaInvalid && (
                  <div className="mb-3 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                    <p className="text-xs text-amber-400">
                      ⚠️ <strong>Check-in invalidado pelo admin.</strong> Este registro não conta para sua pontuação. Entre em contato se acreditar que é um engano.
                    </p>
                  </div>
                )}

                {(aulaApproved || aulaInvalid) && aulaCI?.insight && (
                  <div>
                    <blockquote className="text-sm text-gray-300 bg-gray-800/60 rounded-lg px-4 py-3 border-l-2 border-violet-500/40 italic mb-2">
                      "{aulaCI.insight}"
                    </blockquote>
                    {new Date(aulaCI.updatedAt).getTime() !== new Date(aulaCI.createdAt).getTime() && (
                      <p className="text-xs text-gray-600 mb-2">Editado em {formatDate(aulaCI.updatedAt)}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingCheckIn(aulaCI)}
                        className="text-xs px-2.5 py-1 rounded bg-gray-800/60 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                      >
                        ✏️ Editar check-in
                      </button>
                      <button
                        onClick={() => handleDeleteCheckIn(aulaCI.id)}
                        disabled={submitting === aulaCI.id}
                        className="text-xs px-2.5 py-1 rounded bg-gray-800/60 hover:bg-red-900/40 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        🗑 Remover
                      </button>
                    </div>
                  </div>
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
                        placeholder="O que você aprendeu nesta aula? Qual foi o seu maior insight?"
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
                        {insightLen === 0
                          ? 'Mínimo 10 caracteres'
                          : insightValid
                          ? `✓ ${insightLen} caracteres`
                          : `Faltam ${10 - insightLen} caracteres`}
                      </div>
                    </div>
                    {aulaErrors[live.id] && (
                      <p className="text-xs text-red-400">{aulaErrors[live.id]}</p>
                    )}
                    <button
                      onClick={() => handleSubmit(live.id, 'AULA')}
                      disabled={submitting === `${live.id}_AULA` || !insightValid}
                      className="btn-primary text-sm w-full"
                    >
                      {submitting === `${live.id}_AULA` ? 'Enviando...' : 'Fazer check-in'}
                    </button>
                  </div>
                )}

                {aulaSuccess[live.id] && (
                  <p className="text-sm text-emerald-400">
                    ✅ Check-in registrado! Você avançou mais um km na Maratona PM3! 🏃
                  </p>
                )}
              </div>

              {/* LINKEDIN section */}
              {(live.isActive || linkedinCI) && (
                <div className="border border-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
                        🚀 Bônus LinkedIn: +3 pontos (opcional)
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {linkedinCI?.status === 'APPROVED' && (
                        <span className="badge-approved">✓ Registrado</span>
                      )}
                      {linkedinCI?.status === 'REJECTED' && (
                        <span className="badge-rejected">✗ Rejeitado</span>
                      )}
                    </div>
                  </div>

                  {!linkedinCI && aulaApproved && (
                    <p className="text-xs text-gray-500 mb-3">
                      Compartilhe seu insight no LinkedIn e ganhe 3 pontos extras no ranking.
                    </p>
                  )}

                  {!linkedinCI && !aulaApproved && live.isActive && (
                    <p className="text-xs text-gray-600 mb-3">
                      🔒 Faça o check-in da aula primeiro para liberar o bônus LinkedIn.
                    </p>
                  )}

                  {linkedinCI?.status === 'APPROVED' && linkedinCI?.linkedinUrl && (
                    <div className="text-xs text-gray-500 bg-gray-800/40 rounded-lg px-3 py-2 mb-3">
                      <a
                        href={linkedinCI.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-violet-400 hover:text-violet-300 break-all"
                      >
                        {linkedinCI.linkedinUrl}
                      </a>
                      {new Date(linkedinCI.updatedAt).getTime() !== new Date(linkedinCI.createdAt).getTime() && (
                        <p className="text-gray-600 mt-1">Editado em {formatDate(linkedinCI.updatedAt)}</p>
                      )}
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => setEditingCheckIn(linkedinCI)}
                          className="text-xs px-2.5 py-1 rounded bg-gray-800/60 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                        >
                          ✏️ Editar check-in
                        </button>
                        <button
                          onClick={() => handleDeleteCheckIn(linkedinCI.id)}
                          disabled={submitting === linkedinCI.id}
                          className="text-xs px-2.5 py-1 rounded bg-gray-800/60 hover:bg-red-900/40 text-gray-400 hover:text-red-400 transition-colors"
                        >
                          🗑 Remover
                        </button>
                      </div>
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
                      🎯 Publicação registrada! +3 pontos adicionados!
                    </p>
                  )}
                </div>
              )}

              {/* Recording — last */}
              <div className="mt-3">
                {live.recordingUrl ? (
                  <button
                    onClick={() => setRecordingLiveId(live.id)}
                    className="btn-primary text-sm w-full"
                  >
                    ▶ Assistir aula gravada
                  </button>
                ) : (
                  <div className="border border-gray-800/60 rounded-lg px-4 py-2.5 flex items-center gap-2 opacity-40 cursor-not-allowed select-none">
                    <span className="text-sm text-gray-500">🎥 Gravação disponível em breve</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
