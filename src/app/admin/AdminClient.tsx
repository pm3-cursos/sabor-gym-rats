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
  instructor: string | null
  scheduledAt: string | null
  order: number
  isActive: boolean
  recordingUrl: string | null
  liveType: string
  linkVisibleEarly: boolean
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

interface FinalChallengeRow {
  id: string
  userId: string
  userName: string
  userEmail: string
  challengeUrl: string
  submittedAt: string
  points: number
}

interface Props {
  checkIns: CheckIn[]
  lives: Live[]
  users: UserRow[]
  finalChallenges: FinalChallengeRow[]
  challengeUrl: string | null
  challengeShortDesc: string | null
  challengeUnlockAt: string | null
  showRanking: boolean
  showFeed: boolean
  emailFrom: string | null
  adminEmail: string | null
}

type Tab = 'checkins' | 'participants' | 'lives' | 'settings'

interface ConfirmState {
  message: string
  onConfirm: () => Promise<void>
}

function AdminConfirmModal({ state, onCancel }: { state: ConfirmState; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="card p-6 max-w-sm w-full space-y-4">
        <p className="text-sm text-gray-300">{state.message}</p>
        <div className="flex gap-3">
          <button onClick={() => state.onConfirm()} className="btn-danger flex-1">
            Confirmar
          </button>
          <button onClick={onCancel} className="btn-secondary flex-1">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminClient({
  checkIns,
  lives,
  users,
  finalChallenges,
  challengeUrl: initialChallengeUrl,
  challengeShortDesc: initialChallengeShortDesc,
  challengeUnlockAt: initialChallengeUnlockAt,
  showRanking: initialShowRanking,
  showFeed: initialShowFeed,
  emailFrom: initialEmailFrom,
  adminEmail,
}: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('checkins')
  const [processing, setProcessing] = useState<string | null>(null)
  const [editingLive, setEditingLive] = useState<string | null>(null)
  const [liveForms, setLiveForms] = useState<Record<string, Partial<Live>>>({})
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)
  const [challengeUrlInput, setChallengeUrlInput] = useState(initialChallengeUrl ?? '')
  const [challengeShortDescInput, setChallengeShortDescInput] = useState(initialChallengeShortDesc ?? '')
  const [challengeUnlockAtInput, setChallengeUnlockAtInput] = useState(
    initialChallengeUnlockAt
      ? new Date(initialChallengeUnlockAt).toISOString().slice(0, 16)
      : '2026-03-17T00:00',
  )
  const [showRankingInput, setShowRankingInput] = useState(initialShowRanking)
  const [showFeedInput, setShowFeedInput] = useState(initialShowFeed)
  const [emailFromInput, setEmailFromInput] = useState(initialEmailFrom ?? '')
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [settingsError, setSettingsError] = useState('')

  // Test email state
  const [testEmailTo, setTestEmailTo] = useState(adminEmail ?? '')
  const [testEmailSending, setTestEmailSending] = useState(false)
  const [testEmailResult, setTestEmailResult] = useState<{ ok: boolean; message: string } | null>(null)

  // Admin per-check-in edit state (Participants tab)
  const [adminEditCI, setAdminEditCI] = useState<CheckIn | null>(null)
  const [adminEditInsight, setAdminEditInsight] = useState('')
  const [adminEditUrl, setAdminEditUrl] = useState('')
  const [adminEditError, setAdminEditError] = useState('')

  // Search / filter state
  const [userSearch, setUserSearch] = useState('')
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
  const [ciFilterLiveId, setCiFilterLiveId] = useState('')
  const [ciFilterType, setCiFilterType] = useState<'' | 'AULA' | 'LINKEDIN'>('')
  const [ciFilterValid, setCiFilterValid] = useState<'' | 'valid' | 'invalid'>('')

  // Derived filtered data
  const filteredUsers = userSearch
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
          u.email.toLowerCase().includes(userSearch.toLowerCase()),
      )
    : users

  const filteredCheckIns = checkIns.filter((c) => {
    if (ciFilterLiveId && c.live.id !== ciFilterLiveId) return false
    if (ciFilterType && c.type !== ciFilterType) return false
    if (ciFilterValid === 'valid' && c.isInvalid) return false
    if (ciFilterValid === 'invalid' && !c.isInvalid) return false
    return true
  })

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

  function deleteCheckIn(id: string) {
    setConfirmState({
      message: 'Excluir este check-in permanentemente?',
      onConfirm: async () => {
        setConfirmState(null)
        setProcessing(id)
        await fetch(`/api/admin/checkins/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete' }),
        })
        setProcessing(null)
        router.refresh()
      },
    })
  }

  function openAdminEdit(ci: CheckIn) {
    setAdminEditCI(ci)
    setAdminEditInsight(ci.insight || '')
    setAdminEditUrl(ci.linkedinUrl || '')
    setAdminEditError('')
  }

  async function saveAdminEdit() {
    if (!adminEditCI) return
    setAdminEditError('')
    const body: Record<string, string> = { action: 'edit' }
    if (adminEditCI.type === 'AULA') {
      if (adminEditInsight.trim().length < 10) {
        setAdminEditError('Mínimo 10 caracteres.')
        return
      }
      body.insight = adminEditInsight.trim()
    } else {
      const trimmed = adminEditUrl.trim()
      if (!trimmed.startsWith('https://www.linkedin.com/') || !trimmed.includes('posts/')) {
        setAdminEditError('URL LinkedIn inválida.')
        return
      }
      body.linkedinUrl = trimmed
    }
    setProcessing(adminEditCI.id)
    await fetch(`/api/admin/checkins/${adminEditCI.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setProcessing(null)
    setAdminEditCI(null)
    router.refresh()
  }

  function adminInvalidateCheckIn(id: string, isInvalid: boolean) {
    setConfirmState({
      message: isInvalid ? 'Revalidar este check-in?' : 'Invalidar este check-in? Os pontos serão removidos.',
      onConfirm: async () => {
        setConfirmState(null)
        setProcessing(id)
        await fetch(`/api/admin/checkins/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'invalidate' }),
        })
        setProcessing(null)
        router.refresh()
      },
    })
  }

  function adminDeleteCheckIn(id: string) {
    setConfirmState({
      message: 'Excluir este check-in permanentemente? O usuário receberá uma notificação.',
      onConfirm: async () => {
        setConfirmState(null)
        setProcessing(id)
        await fetch(`/api/admin/checkins/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete' }),
        })
        setProcessing(null)
        router.refresh()
      },
    })
  }

  function toggleBan(userId: string, isBanned: boolean) {
    const action = isBanned ? 'unban' : 'ban'
    const message = isBanned
      ? 'Desbanir este participante? O login será liberado.'
      : 'Banir este participante? O login será bloqueado.'
    setConfirmState({
      message,
      onConfirm: async () => {
        setConfirmState(null)
        setProcessing(userId)
        await fetch(`/api/admin/users/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        })
        setProcessing(null)
        router.refresh()
      },
    })
  }

  function deleteUser(userId: string) {
    setConfirmState({
      message: 'Excluir conta e todos os check-ins deste participante? Esta ação é irreversível.',
      onConfirm: async () => {
        setConfirmState(null)
        setProcessing(userId)
        const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
        setProcessing(null)
        if (res.ok) {
          router.refresh()
        } else {
          alert('Erro ao excluir usuário. Tente novamente.')
        }
      },
    })
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

  function toDatetimeLocalBRT(isoString: string): string {
    return new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(new Date(isoString)).replace(' ', 'T')
  }

  async function updateLive(id: string) {
    const form = liveForms[id]
    if (!form) return
    setProcessing(id)
    const formToSend = { ...form }
    if (formToSend.scheduledAt) {
      formToSend.scheduledAt = new Date(formToSend.scheduledAt + ':00-03:00').toISOString()
    }
    await fetch(`/api/admin/lives/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formToSend),
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

  async function sendTestEmail() {
    setTestEmailSending(true)
    setTestEmailResult(null)
    const res = await fetch('/api/admin/test-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: testEmailTo }),
    })
    const data = await res.json()
    setTestEmailSending(false)
    if (res.ok) {
      setTestEmailResult({ ok: true, message: `✅ E-mail enviado! ID: ${data.id} · Remetente: ${data.from} · URL: ${data.appUrl}` })
    } else {
      setTestEmailResult({ ok: false, message: `❌ ${data.error}` })
    }
  }

  async function saveSettings() {
    setSettingsError('')
    setSettingsSaved(false)

    // Convert local datetime input → UTC ISO (treat input as BRT = UTC-3)
    const unlockAtISO = challengeUnlockAtInput
      ? new Date(challengeUnlockAtInput + ':00-03:00').toISOString()
      : ''

    const pairs = [
      { key: 'challengeUrl', value: challengeUrlInput.trim() },
      { key: 'challengeShortDesc', value: challengeShortDescInput.trim() },
      { key: 'challengeUnlockAt', value: unlockAtISO },
      { key: 'showRanking', value: showRankingInput ? 'true' : 'false' },
      { key: 'showFeed', value: showFeedInput ? 'true' : 'false' },
      { key: 'emailFrom', value: emailFromInput.trim() },
    ]

    const results = await Promise.all(
      pairs.map((pair) =>
        fetch('/api/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pair),
        }),
      ),
    )

    if (results.every((r) => r.ok)) {
      setSettingsSaved(true)
      setTimeout(() => setSettingsSaved(false), 3000)
      router.refresh()
    } else {
      setSettingsError('Erro ao salvar uma ou mais configurações.')
    }
  }

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'checkins', label: 'Check-ins', count: checkIns.length + finalChallenges.length },
    { id: 'participants', label: 'Participantes', count: users.length },
    { id: 'lives', label: 'Aulas' },
    { id: 'settings', label: 'Config.' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {confirmState && <AdminConfirmModal state={confirmState} onCancel={() => setConfirmState(null)} />}

      {/* Admin edit check-in modal */}
      {adminEditCI && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="card p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Editar check-in (Admin)</h3>
              <button onClick={() => setAdminEditCI(null)} className="text-gray-500 hover:text-white transition-colors text-lg">✕</button>
            </div>
            <p className="text-xs text-gray-500">
              Aula {adminEditCI.live.order} · {adminEditCI.live.title} · {adminEditCI.user.name}
            </p>
            {adminEditCI.type === 'AULA' ? (
              <div className="space-y-1">
                <label className="text-xs text-gray-400 block">Insight</label>
                <textarea
                  className="input text-sm resize-none w-full"
                  rows={4}
                  value={adminEditInsight}
                  onChange={(e) => setAdminEditInsight(e.target.value)}
                  autoFocus
                />
                <div className={`text-xs text-right tabular-nums ${adminEditInsight.trim().length < 10 ? 'text-gray-600' : 'text-emerald-400'}`}>
                  {adminEditInsight.trim().length < 10
                    ? `Faltam ${10 - adminEditInsight.trim().length} caracteres`
                    : `✓ ${adminEditInsight.trim().length} caracteres`}
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-xs text-gray-400 block">URL LinkedIn</label>
                <input
                  type="url"
                  className="input text-sm w-full"
                  value={adminEditUrl}
                  onChange={(e) => setAdminEditUrl(e.target.value)}
                  placeholder="https://www.linkedin.com/posts/..."
                  autoFocus
                />
              </div>
            )}
            {adminEditError && <p className="text-xs text-red-400">{adminEditError}</p>}
            <div className="flex gap-3">
              <button onClick={saveAdminEdit} disabled={processing === adminEditCI.id} className="btn-primary flex-1">
                {processing === adminEditCI.id ? 'Salvando...' : 'Salvar'}
              </button>
              <button onClick={() => setAdminEditCI(null)} className="btn-secondary flex-1">Cancelar</button>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mb-6 gap-3">
        <h1 className="text-2xl font-bold">Painel Admin</h1>
        <a
          href="/api/admin/export"
          download
          className="btn-secondary text-sm flex items-center gap-1.5 no-underline"
        >
          📥 Exportar CSV
        </a>
      </div>

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

          {/* Final Challenge submissions */}
          {finalChallenges.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-violet-400 uppercase tracking-wide mb-2">
                🏁 Desafio da Maratona PM3 — {finalChallenges.length} entrega{finalChallenges.length !== 1 ? 's' : ''}
              </h3>
              <div className="space-y-2">
                {finalChallenges.map((fc) => (
                  <div key={fc.id} className="card p-4 border-violet-800/30 bg-violet-500/5">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-medium text-sm">{fc.userName}</span>
                      <span className="text-gray-600 text-xs">{fc.userEmail}</span>
                      <span className="text-xs bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full font-medium shrink-0">
                        Desafio +{fc.points}pts
                      </span>
                      <span className="text-xs text-gray-600 ml-auto shrink-0">
                        {new Date(fc.submittedAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: 'America/Sao_Paulo',
                        })}
                      </span>
                    </div>
                    <a
                      href={fc.challengeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 break-all flex items-center gap-1"
                    >
                      <span>🔗</span>
                      <span className="truncate">{fc.challengeUrl}</span>
                    </a>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-800/60 my-4" />
            </div>
          )}

          {/* Lesson check-ins — Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              className="input text-sm flex-1 min-w-[150px]"
              value={ciFilterLiveId}
              onChange={(e) => setCiFilterLiveId(e.target.value)}
            >
              <option value="">Todas as aulas</option>
              {lives.map((l) => (
                <option key={l.id} value={l.id}>
                  Aula {l.order} — {l.title}
                </option>
              ))}
            </select>
            <select
              className="input text-sm w-36"
              value={ciFilterType}
              onChange={(e) => setCiFilterType(e.target.value as '' | 'AULA' | 'LINKEDIN')}
            >
              <option value="">Todos os tipos</option>
              <option value="AULA">Aula</option>
              <option value="LINKEDIN">LinkedIn</option>
            </select>
            <select
              className="input text-sm w-36"
              value={ciFilterValid}
              onChange={(e) => setCiFilterValid(e.target.value as '' | 'valid' | 'invalid')}
            >
              <option value="">Todos os status</option>
              <option value="valid">Válidos</option>
              <option value="invalid">Inválidos</option>
            </select>
            {(ciFilterLiveId || ciFilterType || ciFilterValid) && (
              <button
                onClick={() => { setCiFilterLiveId(''); setCiFilterType(''); setCiFilterValid('') }}
                className="text-xs text-gray-500 hover:text-white px-2"
              >
                ✕ Limpar
              </button>
            )}
          </div>
          <p className="text-xs text-gray-600">
            {filteredCheckIns.length} de {checkIns.length} check-in{checkIns.length !== 1 ? 's' : ''}
          </p>

          {filteredCheckIns.length === 0 ? (
            <div className="card p-10 text-center text-gray-600">
              <div className="text-3xl mb-2">🔍</div>
              Nenhum check-in encontrado.
            </div>
          ) : (
            filteredCheckIns.map((c) => (
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
                      timeZone: 'America/Sao_Paulo',
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
          {/* Search */}
          <input
            type="text"
            className="input text-sm w-full"
            placeholder="🔍 Buscar por nome ou e-mail..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
          />
          {userSearch && (
            <p className="text-xs text-gray-600">
              {filteredUsers.length} de {users.length} participante{users.length !== 1 ? 's' : ''}
            </p>
          )}

          {filteredUsers.length === 0 ? (
            <div className="card p-10 text-center text-gray-600">
              {userSearch ? 'Nenhum participante encontrado.' : 'Nenhum participante ainda.'}
            </div>
          ) : (
            filteredUsers.map((u) => (
              <div
                key={u.id}
                className={`card p-4 ${u.isBanned ? 'opacity-60 border-red-800/30' : ''}`}
              >
                {/* Row header — click to expand */}
                <div
                  className="flex flex-wrap items-center gap-3 cursor-pointer select-none"
                  onClick={() => setExpandedUserId(expandedUserId === u.id ? null : u.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{u.name}</span>
                      {u.isBanned && (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-medium">
                          Banido
                        </span>
                      )}
                      <span className="text-xs text-gray-600 ml-auto">
                        {expandedUserId === u.id ? '▲' : '▼'}
                      </span>
                    </div>
                    <span className="text-gray-600 text-xs">{u.email}</span>
                    <div className="flex gap-3 mt-1 text-xs text-gray-500">
                      <span className="font-medium text-violet-400">{u.points} pts</span>
                      <span>{u.aulaCount} aulas</span>
                      <span>{u.checkInsCount} check-ins</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
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

                {/* Expanded: check-in history */}
                {expandedUserId === u.id && (
                  <div className="mt-3 pt-3 border-t border-gray-800/60">
                    <p className="text-xs text-gray-500 mb-2 font-medium">Histórico de check-ins</p>

                    {/* Final Challenge submission in participant history */}
                    {(() => {
                      const fc = finalChallenges.find((f) => f.userId === u.id)
                      if (!fc) return null
                      return (
                        <div className="text-xs rounded-lg px-3 py-2 bg-violet-900/20 border border-violet-800/30 mb-2 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-violet-300">🏁 Desafio da Maratona PM3</span>
                            <span className="px-1.5 py-0.5 rounded text-xs bg-violet-500/20 text-violet-400">
                              +{fc.points}pts
                            </span>
                            <span className="text-gray-600 ml-auto">
                              {new Date(fc.submittedAt).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                timeZone: 'America/Sao_Paulo',
                              })}
                            </span>
                          </div>
                          <a
                            href={fc.challengeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 truncate block"
                          >
                            {fc.challengeUrl}
                          </a>
                        </div>
                      )
                    })()}

                    {checkIns.filter((c) => c.user.id === u.id).length === 0 ? (
                      <p className="text-xs text-gray-600 italic">Sem check-ins de aulas registrados.</p>
                    ) : (
                      <div className="space-y-2">
                        {checkIns
                          .filter((c) => c.user.id === u.id)
                          .sort((a, b) => a.live.order - b.live.order)
                          .map((c) => (
                            <div
                              key={c.id}
                              className={`text-xs rounded-lg px-3 py-2 flex flex-col gap-0.5 ${
                                c.isInvalid
                                  ? 'bg-red-900/10 border border-red-800/30'
                                  : 'bg-gray-800/40'
                              }`}
                            >
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-gray-300">
                                  Aula {c.live.order}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-xs ${
                                    c.type === 'LINKEDIN'
                                      ? 'bg-blue-500/20 text-blue-400'
                                      : 'bg-violet-500/20 text-violet-400'
                                  }`}
                                >
                                  {c.type === 'LINKEDIN' ? '+3pts LinkedIn' : '+1pt Aula'}
                                </span>
                                {c.isInvalid && (
                                  <span className="text-red-400">🚫 Inválido</span>
                                )}
                                <span className="text-gray-600 ml-auto">
                                  {new Date(c.createdAt).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: 'short',
                                    timeZone: 'America/Sao_Paulo',
                                  })}
                                </span>
                              </div>
                              {c.insight && (
                                <p className="text-gray-500 italic line-clamp-2">"{c.insight}"</p>
                              )}
                              {c.linkedinUrl && (
                                <a
                                  href={c.linkedinUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300 truncate"
                                >
                                  {c.linkedinUrl}
                                </a>
                              )}
                              {/* Per-check-in admin actions */}
                              <div className="flex gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => openAdminEdit(c)}
                                  disabled={processing === c.id}
                                  className="text-xs px-2 py-0.5 rounded bg-gray-700/60 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors"
                                >
                                  ✏️ Editar
                                </button>
                                <button
                                  onClick={() => adminInvalidateCheckIn(c.id, c.isInvalid)}
                                  disabled={processing === c.id}
                                  className={`text-xs px-2 py-0.5 rounded transition-colors ${c.isInvalid ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'}`}
                                >
                                  {c.isInvalid ? '✅ Revalidar' : '⚠️ Invalidar'}
                                </button>
                                <button
                                  onClick={() => adminDeleteCheckIn(c.id)}
                                  disabled={processing === c.id}
                                  className="text-xs px-2 py-0.5 rounded bg-gray-700/60 hover:bg-red-900/40 text-gray-400 hover:text-red-400 transition-colors"
                                >
                                  🗑 Excluir
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
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
                      <label className="text-xs text-gray-400 mb-1 block">Tipo de aula</label>
                      <select
                        className="input text-sm"
                        defaultValue={live.liveType}
                        onChange={(e) =>
                          setLiveForms((p) => ({
                            ...p,
                            [live.id]: { ...p[live.id], liveType: e.target.value },
                          }))
                        }
                      >
                        <option value="ASYNC">📹 Assíncrona (gravação)</option>
                        <option value="LIVE">🔴 Ao vivo</option>
                      </select>
                    </div>
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
                      <label className="text-xs text-gray-400 mb-1 block">👤 Instrutor</label>
                      <input
                        type="text"
                        className="input text-sm"
                        placeholder="Nome do instrutor"
                        defaultValue={live.instructor || ''}
                        onChange={(e) =>
                          setLiveForms((p) => ({
                            ...p,
                            [live.id]: { ...p[live.id], instructor: e.target.value },
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
                          live.scheduledAt ? toDatetimeLocalBRT(live.scheduledAt) : ''
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
                    {(liveForms[live.id]?.liveType ?? live.liveType) === 'LIVE' && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`link-early-${live.id}`}
                            defaultChecked={live.linkVisibleEarly}
                            onChange={(e) =>
                              setLiveForms((p) => ({
                                ...p,
                                [live.id]: { ...p[live.id], linkVisibleEarly: e.target.checked },
                              }))
                            }
                            className="w-4 h-4 accent-violet-600"
                          />
                          <label htmlFor={`link-early-${live.id}`} className="text-sm text-gray-300">
                            Liberar link antes do horário (sala de espera)
                          </label>
                        </div>
                        <p className="text-xs text-gray-600 pl-6">
                          Apenas para a próxima aula · requer URL configurada
                        </p>
                      </div>
                    )}
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
                            timeZone: 'America/Sao_Paulo',
                          })}
                        </p>
                      )}
                      <p className="text-xs text-gray-600 pl-7 mt-0.5">
                        {live.checkInsCount} check-in{live.checkInsCount !== 1 ? 's' : ''}
                      </p>
                      {live.recordingUrl && (
                        <p className="text-xs text-violet-500 pl-7 mt-0.5">🎥 Gravação configurada</p>
                      )}
                      {live.linkVisibleEarly && live.liveType === 'LIVE' && (
                        <p className="text-xs text-amber-500 pl-7 mt-0.5">🕐 Sala de espera habilitada</p>
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

      {/* Tab: Configurações */}
      {tab === 'settings' && (
        <div className="space-y-6">
          {/* Challenge settings */}
          <div className="card p-5">
            <h2 className="font-semibold mb-4 text-sm">📋 Desafio da Maratona PM3</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  Descrição curta do desafio
                  <span className="text-gray-600 ml-1">(exibida no dashboard)</span>
                </label>
                <textarea
                  className="input text-sm resize-none"
                  rows={2}
                  placeholder="Você se tornará o PM de um app..."
                  value={challengeShortDescInput}
                  onChange={(e) => setChallengeShortDescInput(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  URL do material de apoio
                  <span className="text-gray-600 ml-1">(deixe vazio para ocultar)</span>
                </label>
                <input
                  type="url"
                  className="input text-sm"
                  placeholder="https://..."
                  value={challengeUrlInput}
                  onChange={(e) => setChallengeUrlInput(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  Data/hora de liberação do desafio
                  <span className="text-gray-600 ml-1">(Horário de Brasília — BRT)</span>
                </label>
                <input
                  type="datetime-local"
                  className="input text-sm"
                  value={challengeUnlockAtInput}
                  onChange={(e) => setChallengeUnlockAtInput(e.target.value)}
                />
                <p className="text-xs text-gray-600 mt-1">
                  Padrão: 17/03/2026 00:00 BRT
                </p>
              </div>
            </div>
          </div>

          {/* Email configuration */}
          <div className="card p-5">
            <h2 className="font-semibold mb-1 text-sm">📧 E-mail — configuração do remetente</h2>
            <p className="text-xs text-gray-500 mb-3">
              Para usar sem domínio próprio, deixe o campo vazio — o remetente padrão{' '}
              <code className="text-violet-400">onboarding@resend.dev</code> já funciona sem nenhuma configuração.
              Para usar seu próprio domínio, verifique-o no{' '}
              <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300">
                painel Resend
              </a>{' '}
              e informe o endereço abaixo.
            </p>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                E-mail remetente (FROM)
                <span className="text-gray-600 ml-1">— padrão: onboarding@resend.dev (sem verificação de domínio)</span>
              </label>
              <input
                type="email"
                className="input text-sm"
                placeholder="noreply@seudominio.com"
                value={emailFromInput}
                onChange={(e) => setEmailFromInput(e.target.value)}
              />
            </div>
          </div>

          {/* Test email */}
          <div className="card p-5">
            <h2 className="font-semibold mb-1 text-sm">🧪 Testar envio de e-mail</h2>
            <p className="text-xs text-gray-500 mb-3">
              Envia um e-mail de teste para verificar se a integração com o Resend está funcionando.
            </p>
            <div className="flex gap-2 items-end flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs text-gray-400 mb-1 block">Destinatário do teste</label>
                <input
                  type="email"
                  className="input text-sm"
                  placeholder="admin@exemplo.com"
                  value={testEmailTo}
                  onChange={(e) => setTestEmailTo(e.target.value)}
                />
              </div>
              <button
                onClick={sendTestEmail}
                disabled={testEmailSending || !testEmailTo}
                className="btn-secondary text-sm shrink-0"
              >
                {testEmailSending ? 'Enviando...' : 'Enviar teste'}
              </button>
            </div>
            {testEmailResult && (
              <div className={`mt-3 text-xs px-3 py-2 rounded-lg ${testEmailResult.ok ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                {testEmailResult.message}
              </div>
            )}
          </div>

          {/* Home navbar visibility */}
          <div className="card p-5">
            <h2 className="font-semibold mb-4 text-sm">🏠 Home — visibilidade do menu</h2>
            <p className="text-xs text-gray-500 mb-3">
              Controla quais links aparecem na navbar para usuários não logados (página inicial).
            </p>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-violet-600"
                  checked={showRankingInput}
                  onChange={(e) => setShowRankingInput(e.target.checked)}
                />
                <span className="text-sm text-gray-300">Mostrar link "Ranking" na Home</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-violet-600"
                  checked={showFeedInput}
                  onChange={(e) => setShowFeedInput(e.target.checked)}
                />
                <span className="text-sm text-gray-300">Mostrar link "Feed" na Home</span>
              </label>
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center gap-3">
            <button onClick={saveSettings} className="btn-primary text-sm">
              Salvar todas as configurações
            </button>
            {settingsSaved && <span className="text-xs text-emerald-400">✓ Salvo!</span>}
            {settingsError && <span className="text-xs text-red-400">{settingsError}</span>}
          </div>
        </div>
      )}
    </div>
  )
}
