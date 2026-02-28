'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface CheckInData {
  id: string
  liveId: string
  type: string
  insight: string | null
  linkedinUrl: string | null
  status: string
  isInvalid: boolean
  createdAt: string
  updatedAt: string
}

interface LiveData {
  id: string
  title: string
  order: number
  isActive: boolean
  scheduledAt: string | null
}

// ─── Edit modal ───────────────────────────────────────────────────────────────

function EditCheckInModal({
  checkIn,
  onSave,
  onCancel,
  saving,
}: {
  checkIn: CheckInData
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
              value={insight}
              onChange={(e) => setInsight(e.target.value)}
              autoFocus
            />
            <div className={`text-xs text-right tabular-nums ${insight.trim().length < 10 ? 'text-gray-600' : 'text-emerald-400'}`}>
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

// ─── Confirm delete modal ─────────────────────────────────────────────────────

function ConfirmModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="card p-6 max-w-sm w-full space-y-4">
        <h3 className="font-semibold">Remover check-in?</h3>
        <p className="text-sm text-gray-400">
          O check-in e os pontos correspondentes serão removidos permanentemente.
        </p>
        <div className="flex gap-3">
          <button onClick={onConfirm} className="btn-danger flex-1">Remover</button>
          <button onClick={onCancel} className="btn-secondary flex-1">Cancelar</button>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MeuProgressoAulas({
  lives,
  checkIns,
}: {
  lives: LiveData[]
  checkIns: CheckInData[]
}) {
  const router = useRouter()
  const [editingCheckIn, setEditingCheckIn] = useState<CheckInData | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  async function handleSaveEdit(data: { insight?: string; linkedinUrl?: string }) {
    if (!editingCheckIn) return
    setSaving(true)
    const res = await fetch(`/api/checkins/${editingCheckIn.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setSaving(false)
    if (!res.ok) {
      const json = await res.json()
      throw new Error(json.error || 'Erro ao salvar.')
    }
    setEditingCheckIn(null)
    setToastMsg('Check-in atualizado!')
    setTimeout(() => setToastMsg(null), 3000)
    router.refresh()
  }

  async function confirmDelete() {
    if (!confirmDeleteId) return
    setSaving(true)
    setConfirmDeleteId(null)
    await fetch(`/api/checkins/${confirmDeleteId}`, { method: 'DELETE' })
    setSaving(false)
    router.refresh()
  }

  return (
    <>
      {editingCheckIn && (
        <EditCheckInModal
          checkIn={editingCheckIn}
          onSave={handleSaveEdit}
          onCancel={() => setEditingCheckIn(null)}
          saving={saving}
        />
      )}

      {confirmDeleteId && (
        <ConfirmModal
          onConfirm={confirmDelete}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      {toastMsg && (
        <div className="fixed bottom-28 md:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-sm px-5 py-2.5 rounded-full shadow-lg whitespace-nowrap">
          ✓ {toastMsg}
        </div>
      )}

      <div className="card overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="font-semibold">Minhas aulas</h2>
        </div>
        <ul className="divide-y divide-gray-800/60">
          {lives.map((live) => {
            const checkIn = checkIns.find((c) => c.liveId === live.id && c.type === 'AULA')
            const isApproved = checkIn?.status === 'APPROVED' && !checkIn.isInvalid
            const isRejected = checkIn?.status === 'REJECTED'
            const isPending = !checkIn && live.isActive
            const canEdit = (checkIn?.status === 'APPROVED') && !!checkIn?.insight

            return (
              <li key={live.id} className="px-5 py-4">
                <div className="flex items-start gap-3">
                  <span
                    className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
                      isApproved
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isRejected
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-gray-800 text-gray-600'
                    }`}
                  >
                    {isApproved ? '✓' : live.order}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${!live.isActive && !checkIn ? 'text-gray-600' : ''}`}>
                      {live.title}
                    </p>
                    {checkIn?.insight && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2 italic">
                        "{checkIn.insight}"
                      </p>
                    )}
                    {canEdit && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => setEditingCheckIn(checkIn)}
                          className="text-xs px-2.5 py-1 rounded bg-gray-800/60 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(checkIn.id)}
                          className="text-xs px-2.5 py-1 rounded bg-gray-800/60 hover:bg-red-900/40 text-gray-400 hover:text-red-400 transition-colors"
                        >
                          🗑 Remover
                        </button>
                      </div>
                    )}
                    {isPending && (
                      <Link
                        href={`/dashboard#live-${live.id}`}
                        className="inline-block mt-2 text-xs bg-violet-600 hover:bg-violet-500 text-white px-3 py-1 rounded-full transition-colors"
                      >
                        Fazer check-in →
                      </Link>
                    )}
                    {isRejected && (
                      <Link
                        href={`/dashboard#live-${live.id}`}
                        className="inline-block mt-2 text-xs bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded-full transition-colors"
                      >
                        Reenviar check-in →
                      </Link>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    {isApproved && (
                      <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                        ✓ Aula assistida
                      </span>
                    )}
                    {isRejected && <span className="badge-rejected text-xs">✗ Rejeitado</span>}
                    {!checkIn && !live.isActive && (
                      <span className="inline-flex items-center text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">
                        {live.scheduledAt
                          ? new Date(live.scheduledAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                          : 'Em breve'}
                      </span>
                    )}
                    {isPending && (
                      <span className="inline-flex items-center text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-medium">
                        Pendente
                      </span>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </>
  )
}
