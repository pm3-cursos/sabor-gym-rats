'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ChallengeDetailsModal from '@/components/ChallengeDetailsModal'

interface SubmittedData {
  challengeUrl: string
  submittedAt: string
  points: number
}

interface Props {
  myFinalChallenge: SubmittedData | null
  unlockAt: string
  isUnlocked: boolean
}

export default function ProgressoChallengeCard({ myFinalChallenge, unlockAt, isUnlocked }: Props) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [submittedState, setSubmittedState] = useState<SubmittedData | null>(myFinalChallenge)
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    setError('')
    const trimmed = url.trim()
    if (!trimmed.startsWith('http')) {
      setError('URL inválida. Deve começar com http.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/final-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeUrl: trimmed }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Erro ao enviar entrega.')
        return
      }
      setSubmittedState(json.finalChallenge)
      router.refresh()
    } catch {
      setError('Erro de rede. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const unlockDate = new Date(unlockAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  })

  return (
    <>
      {modalOpen && <ChallengeDetailsModal onClose={() => setModalOpen(false)} unlockAt={unlockAt} />}

      {submittedState ? (
        /* Submitted state */
        <div className="card p-5 border-emerald-800/40 mb-6">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-xs text-violet-400 font-medium uppercase tracking-wide mb-0.5">Bônus</p>
              <h2 className="font-semibold text-white">Desafio da Maratona PM3</h2>
            </div>
            <span className="text-xs font-semibold bg-violet-500/20 text-violet-300 px-2.5 py-1 rounded-full shrink-0">
              +5 pontos
            </span>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full font-medium">
              ✓ Entregue
            </span>
            <span className="text-xs text-gray-500">
              {new Date(submittedState.submittedAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                timeZone: 'America/Sao_Paulo',
              })}
            </span>
          </div>
          <a
            href={submittedState.challengeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-violet-400 hover:text-violet-300 truncate block mb-3 transition-colors"
          >
            {submittedState.challengeUrl}
          </a>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://go.pm3.com.br/DesafioMaratonaPM3"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-sm"
            >
              Acessar material completo
            </a>
            <button
              onClick={() => setModalOpen(true)}
              className="text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors focus:outline-none focus:underline"
            >
              Detalhes do desafio →
            </button>
          </div>
        </div>
      ) : isUnlocked ? (
        /* Unlocked, not submitted */
        <div className="card p-5 border-violet-800/40 mb-6">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-xs text-violet-400 font-medium uppercase tracking-wide mb-0.5">Bônus</p>
              <h2 className="font-semibold text-white">Desafio da Maratona PM3</h2>
            </div>
            <span className="text-xs font-semibold bg-violet-500/20 text-violet-300 px-2.5 py-1 rounded-full shrink-0">
              +5 pontos
            </span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed mb-4">
            O desafio está disponível! Submeta o link da sua entrega para ganhar +5 pontos.
          </p>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <a
              href="https://go.pm3.com.br/DesafioMaratonaPM3"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-sm"
            >
              Acessar material completo
            </a>
            <button
              onClick={() => setModalOpen(true)}
              className="text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors focus:outline-none focus:underline"
            >
              Detalhes do desafio →
            </button>
          </div>
          <div className="space-y-2 mb-3">
            <input
              type="url"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
              placeholder="https://docs.google.com/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={submitting}
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              onClick={handleSubmit}
              disabled={submitting || !url.trim()}
              className="btn-primary w-full text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Enviando...' : 'Enviar entrega (+5 pts) →'}
            </button>
          </div>
        </div>
      ) : (
        /* Locked state */
        <div className="card p-5 border-gray-800/40 mb-6">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-xs text-violet-400 font-medium uppercase tracking-wide mb-0.5">Bônus</p>
              <h2 className="font-semibold text-white">Desafio da Maratona PM3</h2>
            </div>
            <span className="text-xs font-semibold bg-violet-500/20 text-violet-300 px-2.5 py-1 rounded-full shrink-0">
              +5 pontos
            </span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed mb-4">
            Você se tornará o PM de um aplicativo de controle de hábitos e terá o desafio de aumentar
            a taxa de usuários ativos após 14 dias.
          </p>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-gray-500">🔒</span>
            <span className="text-xs text-gray-500">Disponível em {unlockDate} (00:00h, horário de Brasília)</span>
          </div>
          <div className="space-y-2">
            <button
              disabled
              className="btn-secondary w-full text-sm opacity-50 cursor-not-allowed mb-1"
            >
              🔒 Disponível em {unlockDate}
            </button>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="https://go.pm3.com.br/DesafioMaratonaPM3"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-sm"
              >
                Acessar material completo
              </a>
              <button
                onClick={() => setModalOpen(true)}
                className="text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors focus:outline-none focus:underline"
              >
                Detalhes do desafio →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
