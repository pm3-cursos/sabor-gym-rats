'use client'

import { useEffect } from 'react'

// 17/03/2026 00:00 BRT fallback (matches FINAL_CHALLENGE_UNLOCK_UTC)
const DEFAULT_UNLOCK_AT = '2026-03-17T03:00:00.000Z'

interface Props {
  onClose: () => void
  unlockAt?: string
}

export default function ChallengeDetailsModal({ onClose, unlockAt = DEFAULT_UNLOCK_AT }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 px-4 pb-4 sm:pb-0"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#18151e] border border-[#2c2735] rounded-xl w-full max-w-lg max-h-[88vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#2c2735] sticky top-0 bg-[#18151e] rounded-t-xl">
          <div>
            <p className="text-xs text-violet-400 font-medium uppercase tracking-wide mb-0.5">Maratona PM3</p>
            <h2 className="text-lg font-bold">Desafio da Maratona PM3</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-gray-500 hover:text-white transition-colors text-xl leading-none ml-4 shrink-0 focus:outline-none focus:ring-2 focus:ring-violet-500 rounded"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Context */}
          <div>
            <h3 className="text-sm font-semibold text-gray-200 mb-2">🎯 Contexto</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Você se tornará o PM de um aplicativo de controle de hábitos e terá o desafio de aumentar
              a taxa de usuários ativos após 14 dias. O cenário integra tudo o que você aprendeu durante
              a Maratona PM3: pesquisa de usuário, priorização, definição de métricas e construção de roadmap.
            </p>
          </div>

          {/* Challenge */}
          <div>
            <h3 className="text-sm font-semibold text-gray-200 mb-2">📋 O Desafio</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              O app tem uma taxa de retenção de apenas 22% no D14 (proporção de usuários que ainda usam
              o app 14 dias após o cadastro). Sua missão é identificar as causas raiz desse problema e
              propor uma solução de produto que eleve significativamente esse indicador.
            </p>
          </div>

          {/* Entregables */}
          <div>
            <h3 className="text-sm font-semibold text-gray-200 mb-2">📝 Sua Entrega</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex gap-2">
                <span className="text-violet-400 shrink-0">1.</span>
                <span>Diagnóstico: hipóteses sobre por que usuários abandonam o app nos primeiros 14 dias</span>
              </li>
              <li className="flex gap-2">
                <span className="text-violet-400 shrink-0">2.</span>
                <span>Proposta de solução: feature(s) ou mudanças de produto para endereçar as hipóteses</span>
              </li>
              <li className="flex gap-2">
                <span className="text-violet-400 shrink-0">3.</span>
                <span>Métrica de sucesso: como você mediria que sua solução funcionou</span>
              </li>
              <li className="flex gap-2">
                <span className="text-violet-400 shrink-0">4.</span>
                <span>Priorização: justificativa de por que essa solução antes de outras</span>
              </li>
            </ul>
          </div>

          {/* Format */}
          <div>
            <h3 className="text-sm font-semibold text-gray-200 mb-2">📁 Formato</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Pode ser um documento no Google Docs, Notion, apresentação de slides (Google Slides, PowerPoint,
              Canva) ou qualquer formato de sua preferência — desde que seja acessível via link público.
              Submeta o link da entrega diretamente na plataforma.
            </p>
          </div>

          {/* Points */}
          <div className="bg-violet-500/10 border border-violet-500/25 rounded-lg px-4 py-3">
            <p className="text-sm text-violet-300 font-medium">🏅 +5 pontos bônus pela entrega</p>
            <p className="text-xs text-violet-400/70 mt-0.5">
              Disponível a partir de {new Date(unlockAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo' })} ({new Date(unlockAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}h, horário de Brasília)
            </p>
          </div>

          {/* Disclaimer */}
          <div className="bg-gray-800/50 border border-gray-700/40 rounded-lg px-4 py-3 space-y-1">
            <p className="text-xs font-semibold text-gray-400 mb-1.5">⚠️ Importante</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              A entrega final do desafio não será avaliada qualitativamente pela Equipe PM3.
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Não haverá feedback individual.
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              A submissão será considerada exclusivamente para fins de validação de pontuação.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <button onClick={onClose} className="btn-secondary w-full text-sm">
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
