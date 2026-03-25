import Link from 'next/link'

export default function RegrasPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-6">
        <Link href="/" className="text-sm text-gray-500 hover:text-violet-400 transition-colors">
          ← Voltar
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">Regras da Maratona PM3</h1>

      <div className="space-y-6">
        {/* Pontuação */}
        <div className="card p-6">
          <h2 className="font-semibold text-lg mb-3">Check-ins e pontuação</h2>
          <ul className="space-y-3 text-sm text-gray-400">
            <li className="flex gap-2">
              <strong className="text-violet-400 shrink-0">+1 pt</strong>
              <span>Check-in de aula — assista à aula e registre um comentário/insight sobre o conteúdo.</span>
            </li>
            <li className="flex gap-2">
              <strong className="text-emerald-400 shrink-0">+3 pts</strong>
              <span>Check-in de publicação no LinkedIn — publique sobre a aula, marque @PM3 e envie o link da publicação.</span>
            </li>
            <li className="flex gap-2">
              <strong className="text-violet-300 shrink-0">+5 pts</strong>
              <span>Entrega do Desafio da Maratona.</span>
            </li>
          </ul>
          <ul className="space-y-2 text-sm text-gray-500 mt-4 border-t border-gray-800 pt-4">
            <li>• Check-ins podem ser rejeitados ou invalidados pelo time PM3</li>
            <li>• O insight deve ser genuíno e relacionado ao conteúdo da aula</li>
            <li>• A publicação no LinkedIn deve ter sido feita por você, pertencer ao seu perfil cadastrado e marcar @PM3 no LinkedIn</li>
          </ul>
        </div>

        {/* Desafio final */}
        <div className="card p-6">
          <h2 className="font-semibold text-lg mb-3">🏁 Desafio final</h2>
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-300 leading-relaxed mb-3">
              Ao longo da maratona, é liberado um Desafio especial. Ao completá-lo e enviar sua entrega,
              você ganha <strong className="text-violet-300">+5 pontos bônus</strong> que contam para o ranking final.
            </p>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• O desafio é liberado em data definida pela equipe PM3</li>
              <li>• A submissão é individual e deve ser enviada através do formulário no dashboard</li>
              <li>• Cada participante pode enviar uma entrega única</li>
              <li>• A entrega não é avaliada qualitativamente — só conta a participação</li>
            </ul>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3">
            <p className="text-sm text-amber-300 font-medium mb-1">Importante — Avaliação do desafio</p>
            <p className="text-sm text-amber-300/70">
              A entrega final do desafio não será avaliada qualitativamente pela Equipe PM3.
              Não haverá feedback individual. A submissão será considerada exclusivamente para fins de validação de pontuação.
            </p>
          </div>
        </div>

        {/* Quem ganha */}
        <div className="card p-6">
          <h2 className="font-semibold text-lg mb-3">Quem ganha?</h2>
          <p className="text-sm text-gray-400">
            Quem tiver mais pontos ao final da Maratona (prevista para encerrar em{' '}
            <strong className="text-white">24/03</strong>).
          </p>
        </div>

        {/* Premiação */}
        <div className="card p-6">
          <h2 className="font-semibold text-lg mb-4">Premiação</h2>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2.5 mb-4">
            <p className="text-xs text-amber-400 leading-relaxed">
              ⚠️ <strong>Atenção:</strong> Os prêmios serão entregues somente após validação dos
              check-ins. Participantes com check-ins inválidos não estarão aptos ao prêmio, mesmo
              que estejam nas primeiras posições do ranking.
            </p>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <span className="text-2xl shrink-0">🥇</span>
              <div>
                <p className="font-semibold text-yellow-400 text-sm">1º lugar</p>
                <p className="text-sm text-gray-300">12 meses de acesso a 1 Formação PM3</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-gray-500/10 border border-gray-500/20 rounded-lg p-3">
              <span className="text-2xl shrink-0">🥈</span>
              <div>
                <p className="font-semibold text-gray-300 text-sm">2º lugar</p>
                <p className="text-sm text-gray-400">Ingresso Presencial PM3 Summit &apos;Lead with AI&apos; 2026</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-amber-800/10 border border-amber-800/20 rounded-lg p-3">
              <span className="text-2xl shrink-0">🥉</span>
              <div>
                <p className="font-semibold text-amber-600 text-sm">3º lugar</p>
                <p className="text-sm text-gray-400">12 meses de acesso a 1 Sprint PM3</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
              <span className="text-2xl shrink-0">🏢</span>
              <div>
                <p className="font-semibold text-emerald-400 text-sm">Top 14 colocados</p>
                <p className="text-sm text-gray-300 mb-2">Imersão Presencial no iFood</p>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• Acontecerá em abril (data a confirmar), na sede do iFood, com o time de Produto</li>
                  <li>• Transporte, alimentação e demais custos são de responsabilidade do participante</li>
                  <li>• A PM3 irá validar os check-ins dos 14 primeiros colocados ao fim da Maratona</li>
                  <li>• Se validados, o convite para confirmação de participação será enviado</li>
                  <li>• Participantes têm <strong className="text-gray-300">7 dias</strong> para confirmar — caso contrário, o convite poderá ser transferido</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Certificado */}
        <div className="card p-6">
          <h2 className="font-semibold text-lg mb-3">🎓 Certificado Especial</h2>
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-4">
            <p className="text-sm text-gray-300">
              Todos os participantes que assistirem às{' '}
              <strong className="text-white">6 aulas</strong> receberão um{' '}
              <strong className="text-violet-300">
                Certificado de Participação especial da Maratona PM3
              </strong>.
            </p>
          </div>
        </div>

        {/* Critérios de desempate */}
        <div className="card p-6">
          <h2 className="font-semibold text-lg mb-3">Critérios de desempate</h2>
          <p className="text-sm text-gray-400 mb-3">
            Em caso de empate na 1ª, 2ª ou 3ª posição, os critérios abaixo serão aplicados em ordem:
          </p>
          <ol className="space-y-3">
            <li className="flex gap-3 text-sm">
              <span className="text-violet-400 font-bold shrink-0">1º</span>
              <span className="text-gray-300">Maior número de posts sobre a Maratona PM3 no LinkedIn.</span>
            </li>
            <li className="flex gap-3 text-sm">
              <span className="text-violet-400 font-bold shrink-0">2º</span>
              <span className="text-gray-300">Maior número de interações (comentários) nos posts sobre a Maratona no LinkedIn.</span>
            </li>
            <li className="flex gap-3 text-sm">
              <span className="text-violet-400 font-bold shrink-0">3º</span>
              <span className="text-gray-300">A equipe PM3 escolherá o que considera o melhor post de divulgação da Maratona PM3 no LinkedIn.</span>
            </li>
          </ol>
        </div>

        {/* Conduta */}
        <div className="card p-6">
          <h2 className="font-semibold text-lg mb-3">Conduta</h2>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>• É proibido criar múltiplas contas</li>
            <li>• Check-ins com conteúdo inadequado, copiado ou gerado por IA serão invalidados</li>
            <li>• A equipe PM3 reserva o direito de banir participantes que violem as regras</li>
          </ul>
        </div>

        <div className="text-center pt-4">
          <a
            href="https://pm3com-my.sharepoint.com/:b:/g/personal/admins_pm3_com_br/IQBC0a6MomvmR6qnNFxVxzijAdOxfDFzxC6NzCdpt-v0Bk0?e=DVWwev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-violet-400 hover:text-violet-300 underline transition-colors"
          >
            Ver Termos e Condições completos
          </a>
        </div>
      </div>
    </div>
  )
}
