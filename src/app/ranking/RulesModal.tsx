'use client'

import { useState } from 'react'

export default function RulesModal() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-violet-400 hover:text-violet-300 underline transition-colors"
      >
        Ver regras e premiação →
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="card p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Regras e Premiação</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-white text-xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* Pontuação */}
            <section>
              <h3 className="font-semibold text-violet-400 mb-2">Pontuação</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex gap-2">
                  <span className="text-violet-400 font-bold shrink-0">1 pt</span>
                  <span>Check-in de aula — assista à aula e registre um comentário/insight sobre o conteúdo.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">3 pts</span>
                  <span>Check-in de publicação no LinkedIn — publique sobre a aula e envie o link da publicação.</span>
                </li>
              </ul>
            </section>

            {/* Quem ganha */}
            <section>
              <h3 className="font-semibold text-violet-400 mb-2">Quem ganha?</h3>
              <p className="text-sm text-gray-300">
                Quem tiver mais pontos ao final da Maratona (prevista para encerrar em{' '}
                <strong className="text-white">24/03</strong>).
              </p>
            </section>

            {/* Prêmios */}
            <section>
              <h3 className="font-semibold text-violet-400 mb-2">O que ganha?</h3>

              {/* Aviso de validação */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2.5 mb-3">
                <p className="text-xs text-amber-400 leading-relaxed">
                  ⚠️ <strong>Atenção:</strong> Os prêmios serão entregues somente após validação dos
                  check-ins. Participantes com check-ins inválidos não estarão aptos ao prêmio, mesmo
                  que estejam nas primeiras posições do ranking.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                  <span className="text-2xl shrink-0">🥇</span>
                  <div>
                    <p className="font-semibold text-yellow-400 text-sm">1º lugar</p>
                    <p className="text-sm text-gray-300">Imersão Presencial em Empresa Product-Led</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-gray-500/10 border border-gray-500/20 rounded-lg p-3">
                  <span className="text-2xl shrink-0">🥈</span>
                  <div>
                    <p className="font-semibold text-gray-300 text-sm">2º lugar</p>
                    <p className="text-sm text-gray-400">12 meses de acesso a 1 Formação PM3</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-amber-800/10 border border-amber-800/20 rounded-lg p-3">
                  <span className="text-2xl shrink-0">🥉</span>
                  <div>
                    <p className="font-semibold text-amber-600 text-sm">3º lugar</p>
                    <p className="text-sm text-gray-400">Ingresso Presencial do PM3 Summit 2026</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Certificado Especial */}
            <section>
              <h3 className="font-semibold text-violet-400 mb-2">🎓 Certificado Especial</h3>
              <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-3">
                <p className="text-sm text-gray-300">
                  Todos os participantes que assistirem às{' '}
                  <strong className="text-white">6 aulas</strong> receberão um{' '}
                  <strong className="text-violet-300">
                    Certificado de Participação especial da Maratona PM3
                  </strong>.
                </p>
              </div>
            </section>

            {/* Desempate */}
            <section>
              <h3 className="font-semibold text-violet-400 mb-2">Critérios de desempate</h3>
              <p className="text-sm text-gray-400 mb-3">
                Em caso de empate na 1ª, 2ª ou 3ª posição, os critérios abaixo serão aplicados em ordem:
              </p>
              <ol className="space-y-3">
                <li className="flex gap-3 text-sm">
                  <span className="text-violet-400 font-bold shrink-0">1º</span>
                  <span className="text-gray-300">
                    Maior número de posts sobre a Maratona PM3 no LinkedIn.
                  </span>
                </li>
                <li className="flex gap-3 text-sm">
                  <span className="text-violet-400 font-bold shrink-0">2º</span>
                  <span className="text-gray-300">
                    Maior número de interações (comentários) nos posts sobre a Maratona no LinkedIn.
                  </span>
                </li>
                <li className="flex gap-3 text-sm">
                  <span className="text-violet-400 font-bold shrink-0">3º</span>
                  <span className="text-gray-300">
                    A equipe PM3 escolherá o que considera o melhor post de divulgação da Maratona PM3 no LinkedIn.
                  </span>
                </li>
              </ol>
            </section>

            <button onClick={() => setOpen(false)} className="btn-secondary w-full">
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
