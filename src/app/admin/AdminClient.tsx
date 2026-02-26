'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface CheckIn {
  id: string
  type: string
  linkedinUrl: string | null
  insight: string | null
  status: string
  adminNote: string | null
  createdAt: string
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
  checkInsCount: number
}

interface Props {
  pendingCheckIns: CheckIn[]
  approvedCheckIns: CheckIn[]
  rejectedCheckIns: CheckIn[]
  lives: Live[]
}

type Tab = 'pending' | 'approved' | 'rejected' | 'lives'

export default function AdminClient({
  pendingCheckIns,
  approvedCheckIns,
  rejectedCheckIns,
  lives,
}: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('pending')
  const [processing, setProcessing] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [editingLive, setEditingLive] = useState<string | null>(null)
  const [liveForms, setLiveForms] = useState<Record<string, Partial<Live>>>({})

  async function reviewCheckIn(id: string, status: 'APPROVED' | 'REJECTED') {
    setProcessing(id)
    await fetch(`/api/admin/checkins/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminNote: notes[id] || null }),
    })
    setProcessing(null)
    router.refresh()
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

  function CheckInCard({ checkIn }: { checkIn: CheckIn }) {
    const isPending = checkIn.status === 'PENDING'
    return (
      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
          <div>
            <p className="font-medium">{checkIn.user.name}</p>
            <p className="text-xs text-gray-500">{checkIn.user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              checkIn.type === 'LINKEDIN'
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-violet-500/20 text-violet-400'
            }`}>
              {checkIn.type === 'LINKEDIN' ? 'LinkedIn +3pts' : 'Aula +1pt'}
            </span>
            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">
              Aula {checkIn.live.order}: {checkIn.live.title}
            </span>
          </div>
        </div>

        {checkIn.insight && (
          <blockquote className="text-sm text-gray-300 bg-gray-800/60 rounded-lg px-4 py-3 border-l-2 border-violet-500/40 italic mb-3">
            "{checkIn.insight}"
          </blockquote>
        )}

        {checkIn.linkedinUrl && (
          <a
            href={checkIn.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-violet-400 hover:text-violet-300 break-all block mb-3"
          >
            {checkIn.linkedinUrl}
          </a>
        )}

        {checkIn.adminNote && (
          <p className="text-xs text-red-400 mb-2">Nota: {checkIn.adminNote}</p>
        )}

        {checkIn.reviewedBy && (
          <p className="text-xs text-gray-600 mb-2">
            Revisado por {checkIn.reviewedBy} em{' '}
            {checkIn.reviewedAt
              ? new Date(checkIn.reviewedAt).toLocaleDateString('pt-BR')
              : '—'}
          </p>
        )}

        <p className="text-xs text-gray-600 mb-3">
          Enviado em {new Date(checkIn.createdAt).toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
          })}
        </p>

        {isPending && (
          <>
            <div className="mb-2">
              <input
                type="text"
                className="input text-sm"
                placeholder="Nota para o usuário (opcional)"
                value={notes[checkIn.id] || ''}
                onChange={(e) => setNotes((p) => ({ ...p, [checkIn.id]: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => reviewCheckIn(checkIn.id, 'APPROVED')}
                disabled={processing === checkIn.id}
                className="btn-success flex-1"
              >
                {processing === checkIn.id ? '...' : '✓ Aprovar'}
              </button>
              <button
                onClick={() => reviewCheckIn(checkIn.id, 'REJECTED')}
                disabled={processing === checkIn.id}
                className="btn-danger flex-1"
              >
                {processing === checkIn.id ? '...' : '✗ Rejeitar'}
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'pending', label: 'Pendentes', count: pendingCheckIns.length },
    { id: 'approved', label: 'Aprovados', count: approvedCheckIns.length },
    { id: 'rejected', label: 'Rejeitados', count: rejectedCheckIns.length },
    { id: 'lives', label: 'Lives' },
  ]

  const currentList = tab === 'pending' ? pendingCheckIns : tab === 'approved' ? approvedCheckIns : rejectedCheckIns

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Painel Admin</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-amber-400">{pendingCheckIns.length}</div>
          <div className="text-xs text-gray-500 mt-1">Pendentes</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">{approvedCheckIns.length}</div>
          <div className="text-xs text-gray-500 mt-1">Aprovados</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{rejectedCheckIns.length}</div>
          <div className="text-xs text-gray-500 mt-1">Rejeitados</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-xl p-1 mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-violet-600 text-white'
                : 'text-gray-400 hover:text-white'
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

      {/* Check-ins tabs */}
      {tab !== 'lives' && (
        <div className="space-y-4">
          {currentList.length === 0 ? (
            <div className="card p-10 text-center text-gray-600">
              <div className="text-3xl mb-2">
                {tab === 'pending' ? '🎉' : tab === 'approved' ? '✓' : '—'}
              </div>
              Nenhum check-in {tab === 'pending' ? 'pendente' : tab === 'approved' ? 'aprovado' : 'rejeitado'}
            </div>
          ) : (
            currentList.map((c) => <CheckInCard key={c.id} checkIn={c} />)
          )}
        </div>
      )}

      {/* Lives tab */}
      {tab === 'lives' && (
        <div className="space-y-3">
          {lives.map((live) => {
            const isEditing = editingLive === live.id
            const form = liveForms[live.id] || {}

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
                            weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      )}
                      <p className="text-xs text-gray-600 pl-7 mt-0.5">
                        {live.checkInsCount} check-in{live.checkInsCount !== 1 ? 's' : ''}
                      </p>
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
