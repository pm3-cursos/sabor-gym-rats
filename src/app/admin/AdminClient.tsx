'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface CheckIn {
  id: string
  type: string
  linkedinUrl: string | null
  insight: string | null
  status: string
  isInvalid: boolean
  adminNote: string | null
  createdAt: string
  updatedAt: string
  reviewedAt: string | null
  reviewedBy: string | null
  user: { id: string; name: string; email: string }
  live: { id: string; title: string; order: number }
}

interface Live {
  id: string
  title: string
  description: string | null
  scheduledAt: string | null
  order: number
  isActive: boolean
  recordingUrl: string | null
  checkInsCount: number
}

interface UserRow {
  id: string
  name: string
  email: string
  isBanned: boolean
  createdAt: string
  checkInsCount: number
  points: number
  aulaCount: number
}

interface Props {
  checkIns: CheckIn[]
  lives: Live[]
  users: UserRow[]
}

type Tab = 'checkins' | 'participants' | 'lives'

export default function AdminClient({ checkIns, lives, users }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('checkins')
  const [processing, setProcessing] = useState<string | null>(null)
  const [editingLive, setEditingLive] = useState<string | null>(null)
  const [liveForms, setLiveForms] = useState<Record<string, Partial<Live>>>({})

  // Point adjustment state
  const [adjUserId, setAdjUserId] = useState('')
  const [adjAmount, setAdjAmount] = useState('')
  const [adjReason, setAdjReason] = useState('')
  const [adjError, setAdjError] = useState('')

  const validCount = checkIns.filter((c) => c.status === 'APPROVED' && !c.isInvalid).length
  const invalidCount = checkIns.filter((c) => c.isInvalid).length

  async function toggleInvalidate(id: string) {
    setProcessing(id)
    await fetch(`/api/admin/checkins/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'invalidate' }),
    })
    setProcessing(null)
    router.refresh()
  }

  async function deleteCheckIn(id: string) {
    if (!confirm('Excluir este check-in permanentemente?')) return
    setProcessing(id)
    await fetch(`/api/admin/checkins/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete' }),
    })
    setProcessing(null)
    router.refresh()
  }

  async function toggleBan(userId: string, isBanned: boolean) {
    const action = isBanned ? 'unban' : 'ban'
    const msg = isBanned
      ? 'Desbanir este participante?'
      : 'Banir este participante? O login será bloqueado.'
    if (!confirm(msg)) return
    setProcessing(userId)
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    setProcessing(null)
    router.refresh()
  }

  async function deleteUser(userId: string) {
    if (!confirm('Excluir conta e todos os check-ins deste participante? Esta ação é irreversível.')) return
    setProcessing(userId)
    await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
    setProcessing(null)
    router.refresh()
  }

  async function applyPointAdjustment() {
    setAdjError('')
    const amount = parseInt(adjAmount)
    if (!adjUserId || isNaN(amount)) {
      setAdjError('Selecione um participante e informe um valor.')
      return
    }
    setProcessing('adj')
    const res = await fetch('/api/admin/point-adjustments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: adjUserId, amount, reason: adjReason }),
    })
    setProcessing(null)
    if (res.ok) {
      setAdjUserId('')
      setAdjAmount('')
      setAdjReason('')
      router.refresh()
    } else {
      setAdjError('Erro ao aplicar ajuste.')
    }
  }

  async function updateLive(id: string) {
    const form = liveForms[id]
    if (!form) return
    setProcessing(id)
    await fetch(`/api/admin/lives/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setProcessing(null)
    setEditingLive(null)
    router.refresh()
  }

  function convertYoutubeUrl(url: string): string {
    try {
      const u = new URL(url)
      if (
        (u.hostname === 'www.youtube.com' || u.hostname === 'youtube.com') &&
        u.pathname === '/watch'
      ) {
        const v = u.searchParams.get('v')
        if (v) return `https://www.youtube.com/embed/${v}`
      }
      if (u.hostname === 'youtu.be') {
        const v = u.pathname.slice(1)
        if (v) return `https://www.youtube.com/embed/${v}`
      }
    } catch {
      // not a valid URL, return as-is
    }
    return url
  }

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'checkins', label: 'Check-ins', count: checkIns.length },
    { id: 'participants', label: 'Participantes', count: users.length },
    { id: 'lives', label: 'Lives' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Painel Admin</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">{validCount}</div>
          <div className="text-xs text-gray-500 mt-1">Check-ins válidos</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{invalidCount}</div>
          <div className="text-xs text-gray-500 mt-1">Inválidos</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-violet-400">{users.length}</div>
          <div className="text-xs text-gray-500 mt-1">Participantes</div>
        </div>
      </div>

      {/* Ajuste de pontos */}
      <div className="card p-5 mb-6">
        <h2 className="font-semibold mb-3 text-sm">⚖️ Ajuste manual de pontos</h2>
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="text-xs text-gray-400 mb-1 block">Participante</label>
            <select
              className="input text-sm"
              value={adjUserId}
              onChange={(e) => setAdjUserId(e.target.value)}
            >
              <option value="">Selecionar...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.points} pts)
                </option>
              ))}
            </select>
          </div>
          <div className="w-24">
            <label className="text-xs text-gray-400 mb-1 block">Pontos (±)</label>
            <input
              type="number"
              className="input text-sm"
              placeholder="-5 ou +3"
              value={adjAmount}
              onChange={(e) => setAdjAmount(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="text-xs text-gray-400 mb-1 block">Motivo (opcional)</label>
            <input
              type="text"
              className="input text-sm"
              placeholder="Ex: check-in incorreto"
              value={adjReason}
              onChange={(e) => setAdjReason(e.target.value)}
            />
          </div>
          <button
            onClick={applyPointAdjustment}
            disabled={processing === 'adj'}
            className="btn-primary text-sm"
          >
            {processing === 'adj' ? 'Aplicando...' : 'Aplicar'}
          </button>
        </div>
        {adjError && <p className="text-xs text-red-400 mt-2">{adjError}</p>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-xl p-1 mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className={`ml-1.5 text-xs ${tab === t.id ? 'opacity-80' : 'text-gray-600'}`}>
                ({t.count})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: Check-ins */}
      {tab === 'checkins' && (
        <div className="space-y-4">
          {checkIns.length === 0 ? (
            <div className="card p-10 text-center text-gray-600">
              <div className="text-3xl mb-2">✓</div>
              Nenhum check-in registrado ainda.
            </div>
          ) : (
            checkIns.map((c) => (
              <div
                key={c.id}
                className={`card p-4 ${c.isInvalid ? 'opacity-50 border-red-800/40' : ''}`}
              >
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm">{c.user.name}</span>
                    <span className="text-gray-600 text-xs ml-2">{c.user.email}</span>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      c.type === 'LINKEDIN'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-violet-500/20 text-violet-400'
                    }`}
                  >
                    {c.type === 'LINKEDIN' ? 'LinkedIn +3pts' : 'Aula +1pt'}
                  </span>
                  <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded shrink-0">
                    Aula {c.live.order}
                  </span>
                  {c.isInvalid && (
                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full shrink-0 font-medium">
                      🚫 Inválido
                    </span>
                  )}
                  <span className="text-xs text-gray-600 shrink-0">
                    {new Date(c.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="flex-1 min-w-0 space-y-2">
                    {c.insight && (
                      <blockquote className="text-sm text-gray-300 bg-gray-800/60 rounded-lg px-3 py-2 border-l-2 border-violet-500/40 italic">
                        "{c.insight}"
                      </blockquote>
                    )}
                    {c.linkedinUrl && (
                      <a
                        href={c.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 break-all flex items-center gap-1"
                      >
                        <span>🔗</span>
                        <span className="truncate">{c.linkedinUrl}</span>
                      </a>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => toggleInvalidate(c.id)}
                      disabled={processing === c.id}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                        c.isInvalid
                          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      }`}
                    >
                      {processing === c.id ? '...' : c.isInvalid ? '✅ Revalidar' : '🚫 Invalidar'}
                    </button>
                    <button
                      onClick={() => deleteCheckIn(c.id)}
                      disabled={processing === c.id}
                      className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      🗑 Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Participantes */}
      {tab === 'participants' && (
        <div className="space-y-3">
          {users.length === 0 ? (
            <div className="card p-10 text-center text-gray-600">Nenhum participante ainda.</div>
          ) : (
            users.map((u) => (
              <div
                key={u.id}
                className={`card p-4 flex flex-wrap items-center gap-3 ${
                  u.isBanned ? 'opacity-50 border-red-800/30' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{u.name}</span>
                    {u.isBanned && (
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-medium">
                        Banido
                      </span>
                    )}
                  </div>
                  <span className="text-gray-600 text-xs">{u.email}</span>
                  <div className="flex gap-3 mt-1 text-xs text-gray-500">
                    <span>{u.points} pts</span>
                    <span>{u.aulaCount} aulas</span>
                    <span>{u.checkInsCount} check-ins</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => toggleBan(u.id, u.isBanned)}
                    disabled={processing === u.id}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      u.isBanned
                        ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                    }`}
                  >
                    {processing === u.id ? '...' : u.isBanned ? '✅ Desbanir' : '🚫 Banir'}
                  </button>
                  <button
                    onClick={() => deleteUser(u.id)}
                    disabled={processing === u.id}
                    className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    🗑 Excluir
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Lives */}
      {tab === 'lives' && (
        <div className="space-y-3">
          {lives.map((live) => {
            const isEditing = editingLive === live.id

            return (
              <div key={live.id} className="card p-5">
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Título</label>
                      <input
                        type="text"
                        className="input text-sm"
                        defaultValue={live.title}
                        onChange={(e) =>
                          setLiveForms((p) => ({
                            ...p,
                            [live.id]: { ...p[live.id], title: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Descrição</label>
                      <input
                        type="text"
                        className="input text-sm"
                        defaultValue={live.description || ''}
                        onChange={(e) =>
                          setLiveForms((p) => ({
                            ...p,
                            [live.id]: { ...p[live.id], description: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Data/hora</label>
                      <input
                        type="datetime-local"
                        className="input text-sm"
                        defaultValue={
                          live.scheduledAt
                            ? new Date(live.scheduledAt).toISOString().slice(0, 16)
                            : ''
                        }
                        onChange={(e) =>
                          setLiveForms((p) => ({
                            ...p,
                            [live.id]: { ...p[live.id], scheduledAt: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`active-${live.id}`}
                        defaultChecked={live.isActive}
                        onChange={(e) =>
                          setLiveForms((p) => ({
                            ...p,
                            [live.id]: { ...p[live.id], isActive: e.target.checked },
                          }))
                        }
                        className="w-4 h-4 accent-violet-600"
                      />
                      <label htmlFor={`active-${live.id}`} className="text-sm text-gray-300">
                        Aceitar check-ins
                      </label>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">
                        🎥 URL da gravação
                        <span className="text-gray-600 ml-1">
                          (cole a URL do YouTube — converte automaticamente para embed)
                        </span>
                      </label>
                      <input
                        type="url"
                        className="input text-sm"
                        placeholder="https://www.youtube.com/watch?v=... ou embed"
                        defaultValue={live.recordingUrl || ''}
                        onBlur={(e) => {
                          const converted = convertYoutubeUrl(e.target.value)
                          e.target.value = converted
                          setLiveForms((p) => ({
                            ...p,
                            [live.id]: { ...p[live.id], recordingUrl: converted },
                          }))
                        }}
                        onChange={(e) =>
                          setLiveForms((p) => ({
                            ...p,
                            [live.id]: { ...p[live.id], recordingUrl: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateLive(live.id)}
                        disabled={processing === live.id}
                        className="btn-success"
                      >
                        {processing === live.id ? 'Salvando...' : 'Salvar'}
                      </button>
                      <button
                        onClick={() => setEditingLive(null)}
                        className="btn-secondary text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-gray-600 w-5 text-center">
                          {live.order}
                        </span>
                        <span className="font-medium">{live.title}</span>
                        {live.isActive ? (
                          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                            Aberta
                          </span>
                        ) : (
                          <span className="text-xs bg-gray-800 text-gray-600 px-2 py-0.5 rounded-full">
                            Fechada
                          </span>
                        )}
                      </div>
                      {live.scheduledAt && (
                        <p className="text-xs text-gray-600 pl-7">
                          {new Date(live.scheduledAt).toLocaleDateString('pt-BR', {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      )}
                      <p className="text-xs text-gray-600 pl-7 mt-0.5">
                        {live.checkInsCount} check-in{live.checkInsCount !== 1 ? 's' : ''}
                      </p>
                      {live.recordingUrl && (
                        <p className="text-xs text-violet-500 pl-7 mt-0.5">🎥 Gravação configurada</p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setEditingLive(live.id)
                        setLiveForms((p) => ({ ...p, [live.id]: {} }))
                      }}
                      className="text-xs text-gray-500 hover:text-violet-400 transition-colors shrink-0"
                    >
                      Editar
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
