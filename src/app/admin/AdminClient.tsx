'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getUserLevel } from '@/lib/points'

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
  checkInOpenAt: string | null
  checkInDisabled: boolean
  recordingUrl: string | null
  liveUrl: string | null
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
  couponRank: number | null
}

interface FinalChallengeRow {
  id: string
  userId: string
  userName: string
  userEmail: string
  challengeUrl: string
  submittedAt: string
  points: number
  isInvalid: boolean
  invalidationReason?: string | null
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
  upviralUrl: string | null
  referralBanner: boolean
  referralDashboard: boolean
  referralNavbar: boolean
  referralRanking: boolean
  membershipPlusUrl: string | null
  membershipPlusNavbar: boolean
  membershipPlusCard: boolean
  membershipPlusBanner: boolean
}

type Tab = 'checkins' | 'participants' | 'lives' | 'settings' | 'ranking'

interface ConfirmState {
  message: string
  onConfirm: (inputValue?: string) => Promise<void>
  inputLabel?: string
}

function AdminConfirmModal({ state, onCancel }: { state: ConfirmState; onCancel: () => void }) {
  const [inputValue, setInputValue] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="card p-6 max-w-sm w-full space-y-4">
        <p className="text-sm text-gray-300">{state.message}</p>
        {state.inputLabel && (
          <div className="space-y-1">
            <label className="text-xs text-gray-400 block">{state.inputLabel}</label>
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Opcional..."
              rows={3}
              className="w-full bg-gray-800 text-sm text-gray-200 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-500 resize-none"
            />
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={() => state.onConfirm(inputValue || undefined)} className="btn-danger flex-1">
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
  upviralUrl: initialUpviralUrl,
  referralBanner: initialReferralBanner,
  referralDashboard: initialReferralDashboard,
  referralNavbar: initialReferralNavbar,
  referralRanking: initialReferralRanking,
  membershipPlusUrl: initialMembershipPlusUrl,
  membershipPlusNavbar: initialMembershipPlusNavbar,
  membershipPlusCard: initialMembershipPlusCard,
  membershipPlusBanner: initialMembershipPlusBanner,
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
  const [upviralUrlInput, setUpviralUrlInput] = useState(initialUpviralUrl ?? '')
  const [referralBannerInput, setReferralBannerInput] = useState(initialReferralBanner)
  const [referralDashboardInput, setReferralDashboardInput] = useState(initialReferralDashboard)
  const [referralNavbarInput, setReferralNavbarInput] = useState(initialReferralNavbar)
  const [referralRankingInput, setReferralRankingInput] = useState(initialReferralRanking)
  const [membershipPlusUrlInput, setMembershipPlusUrlInput] = useState(initialMembershipPlusUrl ?? '')
  const [membershipPlusNavbarInput, setMembershipPlusNavbarInput] = useState(initialMembershipPlusNavbar)
  const [membershipPlusCardInput, setMembershipPlusCardInput] = useState(initialMembershipPlusCard)
  const [membershipPlusBannerInput, setMembershipPlusBannerInput] = useState(initialMembershipPlusBanner)
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
  const [filterCoupon, setFilterCoupon] = useState<'' | 'eligible' | 'not-eligible'>('')
  const [filterBan, setFilterBan] = useState<'' | 'active' | 'banned'>('')
  const [filterLevel, setFilterLevel] = useState<'' | '0' | '1-2' | '3-5' | '6+'>('')
  const [filterSort, setFilterSort] = useState<'ranking' | 'points' | 'aulas' | 'name'>('ranking')
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
  const [ciFilterLiveId, setCiFilterLiveId] = useState('')
  const [ciFilterType, setCiFilterType] = useState<'' | 'AULA' | 'LINKEDIN'>('')
  const [ciFilterValid, setCiFilterValid] = useState<'' | 'valid' | 'invalid'>('')

  // Final challenge management state (Check-ins tab)
  const [challengeRows, setChallengeRows] = useState<FinalChallengeRow[]>(finalChallenges)
  const [editingChallengeUserId, setEditingChallengeUserId] = useState<string | null>(null)
  const [editChallengeUrlInput, setEditChallengeUrlInput] = useState('')
  const [challengeActionLoading, setChallengeActionLoading] = useState<string | null>(null)

  // Ranking pagination state
  const RANKING_PAGE_SIZE = 20
  const [rankingPage, setRankingPage] = useState(0)

  // Auto-refresh Lives tab every 30s to reflect checkInOpenAt changes
  useEffect(() => {
    if (tab !== 'lives') return
    const interval = setInterval(() => router.refresh(), 30000)
    return () => clearInterval(interval)
  }, [tab, router])

  // Derived ranking data
  const rankedUsers = [...users]
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, 'pt-BR'))
    .map((u, i) => ({ ...u, rank: i + 1 }))
  const rankMap = new Map(rankedUsers.map((u) => [u.id, u.rank]))

  // Derived filtered data
  const filteredUsers = [...users]
    .filter((u) => {
      if (userSearch && !(
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase())
      )) return false
      if (filterCoupon === 'eligible' && u.couponRank === null) return false
      if (filterCoupon === 'not-eligible' && u.couponRank !== null) return false
      if (filterBan === 'active' && u.isBanned) return false
      if (filterBan === 'banned' && !u.isBanned) return false
      if (filterLevel === '0' && u.aulaCount !== 0) return false
      if (filterLevel === '1-2' && (u.aulaCount < 1 || u.aulaCount > 2)) return false
      if (filterLevel === '3-5' && (u.aulaCount < 3 || u.aulaCount > 5)) return false
      if (filterLevel === '6+' && u.aulaCount < 6) return false
      return true
    })
    .sort((a, b) => {
      if (filterSort === 'points') return b.points - a.points || a.name.localeCompare(b.name, 'pt-BR')
      if (filterSort === 'aulas') return b.aulaCount - a.aulaCount || b.points - a.points
      if (filterSort === 'name') return a.name.localeCompare(b.name, 'pt-BR')
      // 'ranking' — maintain original rank order (by points desc, then name)
      return b.points - a.points || a.name.localeCompare(b.name, 'pt-BR')
    })

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
      inputLabel: isInvalid ? undefined : 'Motivo da invalidação (opcional — será enviado ao usuário):',
      onConfirm: async (reason?: string) => {
        setConfirmState(null)
        setProcessing(id)
        await fetch(`/api/admin/checkins/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'invalidate', reason: reason || undefined }),
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
    if (formToSend.checkInOpenAt) {
      formToSend.checkInOpenAt = new Date(formToSend.checkInOpenAt + ':00-03:00').toISOString()
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

  function isLiveEffectivelyActive(live: Live): boolean {
    const now = new Date()
    return (live.isActive || (live.checkInOpenAt !== null && new Date(live.checkInOpenAt) <= now)) && !live.checkInDisabled
  }

  function convertYoutubeUrl(url: string): string {
    try {
      const u = new URL(url)
      if (u.hostname === 'www.youtube.com' || u.hostname === 'youtube.com') {
        if (u.pathname === '/watch') {
          const v = u.searchParams.get('v')
          if (v) return `https://www.youtube.com/embed/${v}`
        }
        const shortsMatch = u.pathname.match(/^\/shorts\/([^/?]+)/)
        if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}`
      }
      if (u.hostname === 'youtu.be') {
        const v = u.pathname.slice(1).split('?')[0]
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
      { key: 'upviralUrl', value: upviralUrlInput.trim() },
      { key: 'referralBanner', value: referralBannerInput ? 'true' : 'false' },
      { key: 'referralDashboard', value: referralDashboardInput ? 'true' : 'false' },
      { key: 'referralNavbar', value: referralNavbarInput ? 'true' : 'false' },
      { key: 'referralRanking', value: referralRankingInput ? 'true' : 'false' },
      { key: 'membershipPlusUrl', value: membershipPlusUrlInput.trim() },
      { key: 'membershipPlusNavbar', value: membershipPlusNavbarInput ? 'true' : 'false' },
      { key: 'membershipPlusCard', value: membershipPlusCardInput ? 'true' : 'false' },
      { key: 'membershipPlusBanner', value: membershipPlusBannerInput ? 'true' : 'false' },
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

  async function handleAdminEditChallenge(userId: string) {
    if (!editChallengeUrlInput.startsWith('http')) return
    setChallengeActionLoading(userId)
    const res = await fetch(`/api/admin/final-challenge/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeUrl: editChallengeUrlInput }),
    })
    if (res.ok) {
      const data = await res.json()
      setChallengeRows((prev) => prev.map((fc) => fc.userId === userId ? { ...fc, challengeUrl: data.finalChallenge.challengeUrl } : fc))
      setEditingChallengeUserId(null)
    }
    setChallengeActionLoading(null)
  }

  function handleAdminToggleInvalidChallenge(userId: string, isInvalid: boolean) {
    setConfirmState({
      message: isInvalid ? 'Revalidar esta entrega do desafio?' : 'Invalidar esta entrega? Os pontos serão removidos.',
      inputLabel: isInvalid ? undefined : 'Motivo da invalidação (opcional — será enviado ao usuário):',
      onConfirm: async (reason?: string) => {
        setConfirmState(null)
        setChallengeActionLoading(userId)
        const res = await fetch(`/api/admin/final-challenge/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: reason || undefined }),
        })
        if (res.ok) {
          const data = await res.json()
          setChallengeRows((prev) => prev.map((fc) => fc.userId === userId ? { ...fc, isInvalid: data.finalChallenge.isInvalid, invalidationReason: data.finalChallenge.invalidationReason } : fc))
        }
        setChallengeActionLoading(null)
      },
    })
  }

  async function handleAdminDeleteChallenge(userId: string) {
    setChallengeActionLoading(userId)
    const res = await fetch(`/api/admin/final-challenge/${userId}`, { method: 'DELETE' })
    if (res.ok) {
      setChallengeRows((prev) => prev.filter((fc) => fc.userId !== userId))
    }
    setChallengeActionLoading(null)
  }

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'checkins', label: 'Check-ins', count: checkIns.length + finalChallenges.length },
    { id: 'participants', label: 'Participantes', count: users.length },
    { id: 'ranking', label: 'Ranking', count: users.length },
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
            onClick={() => { setTab(t.id); setRankingPage(0) }}
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
          {challengeRows.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-violet-400 uppercase tracking-wide mb-2">
                🏁 Desafio da Maratona PM3 — {challengeRows.length} entrega{challengeRows.length !== 1 ? 's' : ''}
              </h3>
              <div className="space-y-2">
                {challengeRows.map((fc) => (
                  <div key={fc.id} className={`card p-4 border-violet-800/30 ${fc.isInvalid ? 'bg-red-500/5 border-red-800/30' : 'bg-violet-500/5'}`}>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-medium text-sm">{fc.userName}</span>
                      <span className="text-gray-600 text-xs">{fc.userEmail}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${fc.isInvalid ? 'bg-red-500/20 text-red-400 line-through' : 'bg-violet-500/20 text-violet-400'}`}>
                        Desafio +{fc.points}pts
                      </span>
                      {fc.isInvalid && (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-medium shrink-0">Invalidado</span>
                      )}
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
                    {editingChallengeUserId === fc.userId ? (
                      <div className="space-y-2 mt-2">
                        <input
                          type="url"
                          className="input text-xs w-full"
                          value={editChallengeUrlInput}
                          onChange={(e) => setEditChallengeUrlInput(e.target.value)}
                          placeholder="https://..."
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAdminEditChallenge(fc.userId)}
                            disabled={challengeActionLoading === fc.userId}
                            className="btn-primary text-xs px-3 py-1"
                          >
                            {challengeActionLoading === fc.userId ? 'Salvando...' : 'Salvar'}
                          </button>
                          <button onClick={() => setEditingChallengeUserId(null)} className="btn-secondary text-xs px-3 py-1">
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <a
                          href={fc.challengeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-xs break-all flex items-center gap-1 ${fc.isInvalid ? 'text-gray-600 line-through' : 'text-blue-400 hover:text-blue-300'}`}
                        >
                          <span>🔗</span>
                          <span className="truncate">{fc.challengeUrl}</span>
                        </a>
                        <div className="flex gap-3 mt-2">
                          <button
                            onClick={() => { setEditingChallengeUserId(fc.userId); setEditChallengeUrlInput(fc.challengeUrl) }}
                            className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleAdminToggleInvalidChallenge(fc.userId, fc.isInvalid)}
                            disabled={challengeActionLoading === fc.userId}
                            className={`text-xs transition-colors ${fc.isInvalid ? 'text-emerald-400 hover:text-emerald-300' : 'text-amber-400 hover:text-amber-300'}`}
                          >
                            {challengeActionLoading === fc.userId ? '...' : fc.isInvalid ? 'Revalidar' : 'Invalidar'}
                          </button>
                          <button
                            onClick={() => setConfirmState({
                              message: `Excluir a entrega do desafio de ${fc.userName}? Isso removerá os +${fc.points} pts permanentemente.`,
                              onConfirm: async () => { setConfirmState(null); await handleAdminDeleteChallenge(fc.userId) },
                            })}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors"
                          >
                            Excluir
                          </button>
                        </div>
                      </>
                    )}
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
                      onClick={() => adminInvalidateCheckIn(c.id, c.isInvalid)}
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
          {/* Search + filters */}
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              className="input text-sm flex-1 min-w-[200px]"
              placeholder="🔍 Buscar por nome ou e-mail..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
            <select
              className="input text-sm w-52"
              value={filterCoupon}
              onChange={(e) => setFilterCoupon(e.target.value as '' | 'eligible' | 'not-eligible')}
            >
              <option value="">Todos — Cupom Replit</option>
              <option value="eligible">✅ Apenas elegíveis</option>
              <option value="not-eligible">— Não elegíveis</option>
            </select>
            <select
              className="input text-sm w-44"
              value={filterBan}
              onChange={(e) => setFilterBan(e.target.value as '' | 'active' | 'banned')}
            >
              <option value="">Todos — Status</option>
              <option value="active">✅ Ativos</option>
              <option value="banned">🚫 Banidos</option>
            </select>
            <select
              className="input text-sm w-52"
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value as '' | '0' | '1-2' | '3-5' | '6+')}
            >
              <option value="">Todos — Nível</option>
              <option value="6+">🥇 Maratonista (6+ aulas)</option>
              <option value="3-5">🥈 Corredor (3–5 aulas)</option>
              <option value="1-2">🥉 Iniciante (1–2 aulas)</option>
              <option value="0">🏁 Na largada (0 aulas)</option>
            </select>
            <select
              className="input text-sm w-44"
              value={filterSort}
              onChange={(e) => setFilterSort(e.target.value as 'ranking' | 'points' | 'aulas' | 'name')}
            >
              <option value="ranking">↕ Ranking</option>
              <option value="points">↓ Pontos</option>
              <option value="aulas">↓ Aulas</option>
              <option value="name">↓ Nome (A–Z)</option>
            </select>
            {(userSearch || filterCoupon || filterBan || filterLevel) && (
              <button
                onClick={() => { setUserSearch(''); setFilterCoupon(''); setFilterBan(''); setFilterLevel('') }}
                className="text-xs text-gray-500 hover:text-white px-2"
              >
                ✕ Limpar
              </button>
            )}
          </div>
          {(userSearch || filterCoupon || filterBan || filterLevel) && (
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
                      <span className="font-mono text-xs text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">
                        #{rankMap.get(u.id)}
                      </span>
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
                    <div className="flex gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                      <span className="font-medium text-violet-400">{u.points} pts</span>
                      <span>{u.aulaCount} aulas</span>
                      <span>{u.checkInsCount} check-ins</span>
                      {u.couponRank !== null ? (
                        <span className="text-emerald-400 font-medium">🎁 Cupom #{u.couponRank}/500</span>
                      ) : (
                        <span className="text-gray-700">🎁 —</span>
                      )}
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
                      const fc = challengeRows.find((f) => f.userId === u.id)
                      if (!fc) return null
                      return (
                        <div className={`text-xs rounded-lg px-3 py-2 mb-2 space-y-1 border ${fc.isInvalid ? 'bg-red-900/10 border-red-800/30' : 'bg-violet-900/20 border-violet-800/30'}`}>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-medium ${fc.isInvalid ? 'text-red-400' : 'text-violet-300'}`}>🏁 Desafio da Maratona PM3</span>
                            <span className={`px-1.5 py-0.5 rounded text-xs ${fc.isInvalid ? 'bg-red-500/20 text-red-400 line-through' : 'bg-violet-500/20 text-violet-400'}`}>
                              +{fc.points}pts
                            </span>
                            {fc.isInvalid && (
                              <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">Invalidado</span>
                            )}
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
                            className={`truncate block ${fc.isInvalid ? 'text-gray-600 line-through' : 'text-blue-400 hover:text-blue-300'}`}
                          >
                            {fc.challengeUrl}
                          </a>
                          <div className="flex gap-3 pt-1">
                            <button
                              onClick={() => { setEditingChallengeUserId(fc.userId); setEditChallengeUrlInput(fc.challengeUrl); setTab('checkins') }}
                              className="text-violet-400 hover:text-violet-300 transition-colors"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleAdminToggleInvalidChallenge(fc.userId, fc.isInvalid)}
                              disabled={challengeActionLoading === fc.userId}
                              className={`transition-colors ${fc.isInvalid ? 'text-emerald-400 hover:text-emerald-300' : 'text-amber-400 hover:text-amber-300'}`}
                            >
                              {challengeActionLoading === fc.userId ? '...' : fc.isInvalid ? 'Revalidar' : 'Invalidar'}
                            </button>
                            <button
                              onClick={() => setConfirmState({
                                message: `Excluir a entrega do desafio de ${fc.userName}?`,
                                onConfirm: async () => { setConfirmState(null); await handleAdminDeleteChallenge(fc.userId) },
                              })}
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              Excluir
                            </button>
                          </div>
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

      {/* Tab: Ranking */}
      {tab === 'ranking' && (() => {
        const totalPages = Math.ceil(rankedUsers.length / RANKING_PAGE_SIZE)
        const pageUsers = rankedUsers.slice(
          rankingPage * RANKING_PAGE_SIZE,
          (rankingPage + 1) * RANKING_PAGE_SIZE,
        )
        return (
          <div className="space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-800">
                    <th className="text-left py-2 pr-4 w-10">#</th>
                    <th className="text-left py-2 pr-4">Nome</th>
                    <th className="text-left py-2 pr-4">Nível</th>
                    <th className="text-right py-2 pr-4">Pts</th>
                    <th className="text-right py-2">Aulas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {pageUsers.map((u) => {
                    const level = getUserLevel(u.aulaCount)
                    return (
                      <tr key={u.id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="py-2.5 pr-4 font-mono text-gray-500 text-xs">{u.rank}</td>
                        <td className="py-2.5 pr-4">
                          <div className="font-medium">{u.name}</div>
                          <div className="text-xs text-gray-600">{u.email}</div>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className={`text-xs ${level.color}`}>
                            {level.icon} {level.label}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 text-right font-medium text-violet-400">
                          {u.points}
                        </td>
                        <td className="py-2.5 text-right text-gray-400">{u.aulaCount}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setRankingPage((p) => Math.max(0, p - 1))}
                  disabled={rankingPage === 0}
                  className="btn-secondary text-xs disabled:opacity-40"
                >
                  ← Anterior
                </button>
                <span className="text-xs text-gray-500">
                  Página {rankingPage + 1} de {totalPages}
                </span>
                <button
                  onClick={() => setRankingPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={rankingPage === totalPages - 1}
                  className="btn-secondary text-xs disabled:opacity-40"
                >
                  Próxima →
                </button>
              </div>
            )}
          </div>
        )
      })()}

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
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">
                        🕐 Liberar check-in automaticamente em:
                        <span className="text-gray-600 ml-1">(Horário de Brasília — BRT)</span>
                      </label>
                      <input
                        type="datetime-local"
                        className="input text-sm"
                        defaultValue={live.checkInOpenAt ? toDatetimeLocalBRT(live.checkInOpenAt) : ''}
                        onChange={(e) =>
                          setLiveForms((p) => ({
                            ...p,
                            [live.id]: { ...p[live.id], checkInOpenAt: e.target.value || null },
                          }))
                        }
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        Deixe vazio para não agendar automaticamente.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`active-${live.id}`}
                        defaultChecked={isLiveEffectivelyActive(live)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setLiveForms((p) => ({
                              ...p,
                              [live.id]: { ...p[live.id], isActive: true, checkInDisabled: false },
                            }))
                          } else {
                            setLiveForms((p) => ({
                              ...p,
                              [live.id]: { ...p[live.id], isActive: false, checkInDisabled: true },
                            }))
                          }
                        }}
                        className="w-4 h-4 accent-violet-600"
                      />
                      <label htmlFor={`active-${live.id}`} className="text-sm text-gray-300">
                        Aceitar check-ins
                        {isLiveEffectivelyActive(live) && !live.isActive && (
                          <span className="ml-1.5 text-xs text-emerald-500">(automático via agendamento)</span>
                        )}
                        {live.checkInDisabled && (
                          <span className="ml-1.5 text-xs text-amber-500">(desabilitado manualmente)</span>
                        )}
                      </label>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">
                        🔗 Link de acesso (sala de espera)
                        <span className="text-gray-600 ml-1">
                          (Zoom, YouTube Live, Meet — abre em nova aba)
                        </span>
                      </label>
                      <input
                        type="url"
                        className="input text-sm"
                        placeholder="https://zoom.us/j/... ou youtube.com/live/..."
                        defaultValue={live.liveUrl || ''}
                        onChange={(e) =>
                          setLiveForms((p) => ({
                            ...p,
                            [live.id]: { ...p[live.id], liveUrl: e.target.value },
                          }))
                        }
                      />
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
                        {isLiveEffectivelyActive(live) ? (
                          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                            {live.isActive ? 'Aberta' : 'Aberta (auto)'}
                          </span>
                        ) : live.checkInDisabled ? (
                          <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                            Desabilitada
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
                      {live.checkInOpenAt && !isLiveEffectivelyActive(live) && !live.checkInDisabled && (
                        <p className="text-xs text-violet-500/80 pl-7">
                          🕐 Check-in abre em:{' '}
                          {new Date(live.checkInOpenAt).toLocaleString('pt-BR', {
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
                      {live.liveUrl && (
                        <p className="text-xs text-blue-400 pl-7 mt-0.5">🔗 Link de acesso configurado</p>
                      )}
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

          {/* Referral campaign */}
          <div className="card p-5">
            <h2 className="font-semibold mb-1 text-sm">🎁 Campanha de Indicação — UpViral</h2>
            <p className="text-xs text-gray-500 mb-3">
              URL da campanha no UpViral. Quando preenchida, exibe o card de indicação no dashboard dos participantes e habilita a página <code className="text-violet-400">/indicacao</code>.
              Deixe vazio para ocultar.
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  URL da campanha UpViral
                  <span className="text-gray-600 ml-1">(deixe vazio para ocultar)</span>
                </label>
                <input
                  type="url"
                  className="input text-sm"
                  placeholder="https://app.upviral.com/..."
                  value={upviralUrlInput}
                  onChange={(e) => setUpviralUrlInput(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-gray-500 font-medium">Onde exibir:</p>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-violet-600"
                    checked={referralBannerInput}
                    onChange={(e) => setReferralBannerInput(e.target.checked)}
                  />
                  <span className="text-sm text-gray-300">
                    Banner fixo abaixo da navbar (fechável por sessão)
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-violet-600"
                    checked={referralDashboardInput}
                    onChange={(e) => setReferralDashboardInput(e.target.checked)}
                  />
                  <span className="text-sm text-gray-300">
                    Card no dashboard
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-violet-600"
                    checked={referralNavbarInput}
                    onChange={(e) => setReferralNavbarInput(e.target.checked)}
                  />
                  <span className="text-sm text-gray-300">
                    Link na navbar — "Indicar amigos" (apenas desktop)
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-violet-600"
                    checked={referralRankingInput}
                    onChange={(e) => setReferralRankingInput(e.target.checked)}
                  />
                  <span className="text-sm text-gray-300">
                    Banner na tela de ranking
                  </span>
                </label>
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

          {/* Membership Plus CTA */}
          <div className="card p-5">
            <h2 className="font-semibold mb-1 text-sm">🏆 Membership Plus — CTA</h2>
            <p className="text-xs text-gray-500 mb-3">
              Exibe CTAs apontando para uma página externa do Membership Plus. Cada local pode ser ativado separadamente.
              Os CTAs só aparecem quando o campo de URL estiver preenchido <strong>e</strong> o local estiver ativado.
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  URL do Membership Plus
                  <span className="text-gray-600 ml-1">(deixe vazio para ocultar tudo)</span>
                </label>
                <input
                  type="url"
                  className="input text-sm"
                  placeholder="https://pm3.com.br/membership-plus"
                  value={membershipPlusUrlInput}
                  onChange={(e) => setMembershipPlusUrlInput(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-gray-500 font-medium">Onde exibir:</p>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-violet-600"
                    checked={membershipPlusNavbarInput}
                    onChange={(e) => setMembershipPlusNavbarInput(e.target.checked)}
                  />
                  <span className="text-sm text-gray-300">
                    Navbar — botão destacado à direita (apenas desktop)
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-violet-600"
                    checked={membershipPlusCardInput}
                    onChange={(e) => setMembershipPlusCardInput(e.target.checked)}
                  />
                  <span className="text-sm text-gray-300">
                    Card no dashboard — card sutil com borda violeta
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-violet-600"
                    checked={membershipPlusBannerInput}
                    onChange={(e) => setMembershipPlusBannerInput(e.target.checked)}
                  />
                  <span className="text-sm text-gray-300">
                    Banner fixo abaixo da navbar (fechável por sessão)
                  </span>
                </label>
              </div>
            </div>
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
