'use client'

import { useState } from 'react'
import ChallengeDetailsModal from '@/components/ChallengeDetailsModal'

export default function HomeChallengeSection() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      {modalOpen && <ChallengeDetailsModal onClose={() => setModalOpen(false)} />}
      <div className="card p-5 border-violet-800/40 mt-6">
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
          a taxa de usuários ativos após 14 dias. Disponível a partir de 17/03 para todos os participantes.
        </p>
        <button
          onClick={() => setModalOpen(true)}
          className="text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors focus:outline-none focus:underline"
        >
          Detalhes do desafio →
        </button>
      </div>
    </>
  )
}
