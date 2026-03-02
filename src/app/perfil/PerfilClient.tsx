'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-40 ${checked ? 'bg-violet-600' : 'bg-gray-700'}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6 space-y-4">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{title}</h2>
      {children}
    </div>
  )
}

function DeleteModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  const PHRASE = 'EXCLUIR MINHA CONTA'
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    await onConfirm()
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-sm card p-6 space-y-4">
        <h3 className="text-lg font-bold text-red-400">Excluir conta</h3>
        <p className="text-sm text-gray-300">
          Esta ação é permanente e não pode ser desfeita. Todos os seus check-ins e dados serão mantidos no sistema, mas você não poderá mais acessar esta conta.
        </p>
        <p className="text-sm text-gray-400">
          Digite <span className="font-mono font-bold text-red-400">{PHRASE}</span> para confirmar:
        </p>
        <input
          className="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={PHRASE}
          autoFocus
        />
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 btn-secondary"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={input !== PHRASE || loading}
            className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
          >
            {loading ? 'Excluindo...' : 'Excluir conta'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PerfilClient({
  userName,
  userEmail,
  currentLinkedinUrl,
  showFirstNameOnly,
  reminderDays2,
  reminderDays1,
  reminder12h,
  reminder1h,
}: {
  userName: string
  userEmail: string
  currentLinkedinUrl: string | null
  showFirstNameOnly: boolean
  reminderDays2: boolean
  reminderDays1: boolean
  reminder12h: boolean
  reminder1h: boolean
}) {
  const router = useRouter()

  // Name state
  const [name, setName] = useState(userName)
  const [nameSaving, setNameSaving] = useState(false)
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // LinkedIn state
  const [linkedinUrl, setLinkedinUrl] = useState(currentLinkedinUrl || '')
  const [linkedinSaving, setLinkedinSaving] = useState(false)
  const [linkedinMsg, setLinkedinMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // Privacy state
  const [firstNameOnly, setFirstNameOnly] = useState(showFirstNameOnly)
  const [privacySaving, setPrivacySaving] = useState(false)

  // Reminder states
  const [remDays2, setRemDays2] = useState(reminderDays2)
  const [remDays1, setRemDays1] = useState(reminderDays1)
  const [rem12h, setRem12h] = useState(reminder12h)
  const [rem1h, setRem1h] = useState(reminder1h)
  const [reminderSaving, setReminderSaving] = useState(false)

  // Delete modal
  const [showDelete, setShowDelete] = useState(false)

  async function patchProfile(body: Record<string, unknown>) {
    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return res
  }

  async function saveName(e: React.FormEvent) {
    e.preventDefault()
    setNameMsg(null)
    const trimmed = name.trim()
    if (!trimmed) { setNameMsg({ ok: false, text: 'Nome não pode ficar vazio.' }); return }
    setNameSaving(true)
    const res = await patchProfile({ name: trimmed })
    setNameSaving(false)
    if (res.ok) {
      setNameMsg({ ok: true, text: 'Nome atualizado.' })
      router.refresh()
    } else {
      const d = await res.json()
      setNameMsg({ ok: false, text: d.error || 'Erro ao salvar.' })
    }
  }

  async function saveLinkedin(e: React.FormEvent) {
    e.preventDefault()
    setLinkedinMsg(null)
    const trimmed = linkedinUrl.trim()
    if (trimmed && !trimmed.includes('linkedin.com/')) {
      setLinkedinMsg({ ok: false, text: 'URL inválida. Deve conter "linkedin.com/".' })
      return
    }
    setLinkedinSaving(true)
    const res = await patchProfile({ linkedinProfileUrl: trimmed || null })
    setLinkedinSaving(false)
    if (res.ok) {
      setLinkedinMsg({ ok: true, text: 'LinkedIn atualizado.' })
      router.refresh()
    } else {
      const d = await res.json()
      setLinkedinMsg({ ok: false, text: d.error || 'Erro ao salvar.' })
    }
  }

  async function savePrivacy(val: boolean) {
    setFirstNameOnly(val)
    setPrivacySaving(true)
    await patchProfile({ showFirstNameOnly: val })
    setPrivacySaving(false)
    router.refresh()
  }

  async function saveReminders(updates: Record<string, boolean>) {
    setReminderSaving(true)
    await patchProfile(updates)
    setReminderSaving(false)
  }

  async function handleDeleteAccount() {
    const res = await fetch('/api/user/profile', { method: 'DELETE' })
    if (res.ok) {
      router.push('/login?deleted=1')
    }
  }

  function Msg({ msg }: { msg: { ok: boolean; text: string } | null }) {
    if (!msg) return null
    return (
      <div
        className={`text-sm px-4 py-2.5 rounded-lg border ${
          msg.ok
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}
      >
        {msg.ok ? '✓ ' : ''}{msg.text}
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10 space-y-5">
      <div className="mb-2">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-gray-400 text-sm mt-1">{userEmail}</p>
      </div>

      {/* Name */}
      <Section title="Nome">
        <form onSubmit={saveName} className="space-y-3">
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
            autoComplete="name"
          />
          <Msg msg={nameMsg} />
          <button type="submit" disabled={nameSaving} className="btn-primary w-full">
            {nameSaving ? 'Salvando...' : 'Salvar nome'}
          </button>
        </form>
      </Section>

      {/* LinkedIn */}
      <Section title="LinkedIn">
        <form onSubmit={saveLinkedin} className="space-y-3">
          <input
            type="url"
            className="input"
            placeholder="https://linkedin.com/in/seu-perfil"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            autoComplete="url"
          />
          <p className="text-xs text-gray-500">
            Formato: <span className="text-gray-400 font-mono">https://www.linkedin.com/in/seu-perfil/</span>
          </p>
          <p className="text-xs text-gray-600">
            Necessário para ganhar o bônus de +3 pts por publicação nas aulas.
          </p>
          <Msg msg={linkedinMsg} />
          <button type="submit" disabled={linkedinSaving} className="btn-primary w-full">
            {linkedinSaving ? 'Salvando...' : 'Salvar LinkedIn'}
          </button>
        </form>
      </Section>

      {/* Privacy */}
      <Section title="Privacidade">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-200">Exibir apenas meu primeiro nome</p>
            <p className="text-xs text-gray-500 mt-0.5">No feed e no ranking, outros verão só seu primeiro nome.</p>
          </div>
          <Toggle
            checked={firstNameOnly}
            onChange={savePrivacy}
            disabled={privacySaving}
          />
        </div>
      </Section>

      {/* Reminders */}
      <Section title="Lembretes de aula">
        <p className="text-xs text-gray-500 -mt-1">Receba notificações antes das aulas começarem.</p>

        {(
          [
            { label: '2 dias antes', value: remDays2, key: 'reminderDays2', setter: setRemDays2 },
            { label: '1 dia antes', value: remDays1, key: 'reminderDays1', setter: setRemDays1 },
            { label: '12 horas antes', value: rem12h, key: 'reminder12h', setter: setRem12h },
            { label: '1 hora antes', value: rem1h, key: 'reminder1h', setter: setRem1h },
          ] as const
        ).map((item) => (
          <div key={item.key} className="flex items-center justify-between gap-4 py-1">
            <span className="text-sm text-gray-300">{item.label}</span>
            <Toggle
              checked={item.value}
              disabled={reminderSaving}
              onChange={(val) => {
                item.setter(val)
                saveReminders({ [item.key]: val })
              }}
            />
          </div>
        ))}
      </Section>

      {/* Danger zone */}
      <Section title="Zona de perigo">
        <p className="text-xs text-gray-500 -mt-1">Ações irreversíveis relacionadas à sua conta.</p>
        <button
          type="button"
          onClick={() => setShowDelete(true)}
          className="w-full border border-red-800/50 text-red-400 hover:bg-red-900/20 text-sm font-semibold py-2.5 rounded-xl transition-colors"
        >
          Excluir minha conta
        </button>
      </Section>

      {showDelete && (
        <DeleteModal
          onClose={() => setShowDelete(false)}
          onConfirm={handleDeleteAccount}
        />
      )}
    </div>
  )
}
