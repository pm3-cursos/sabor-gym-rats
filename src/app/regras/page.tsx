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
        <div className="card p-6">
          <h2 className="font-semibold text-lg mb-3">Check-ins e pontuação</h2>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>• <strong className="text-gray-200">+1 ponto</strong> por check-in de aula validado</li>
            <li>• <strong className="text-gray-200">+3 pontos</strong> por publicação no LinkedIn validada</li>
            <li>• <strong className="text-gray-200">+5 pontos</strong> pela entrega final da Maratona</li>
            <li>• Check-ins podem ser rejeitados ou invalidados pelo time PM3</li>
            <li>• O insight deve ser genuíno e relacionado ao conteúdo da aula</li>
            <li>• A publicação no LinkedIn deve ter sido feita por você e pertencer ao seu perfil cadastrado</li>
          </ul>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-lg mb-3">Desafio final</h2>
          <p className="text-sm text-gray-400 leading-relaxed mb-4">
            O Desafio da Maratona PM3 é uma atividade prática que integra os aprendizados das 6 aulas.
            A submissão é individual e deve ser enviada através do formulário disponível no dashboard a partir de 17/03.
          </p>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3">
            <p className="text-sm text-amber-300 font-medium mb-1">Importante — Avaliação do desafio</p>
            <p className="text-sm text-amber-300/70">
              A entrega final do desafio não será avaliada qualitativamente pela Equipe PM3.
              Não haverá feedback individual. A submissão será considerada exclusivamente para fins de validação de pontuação.
            </p>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-lg mb-3">Premiação</h2>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>• Os 3 participantes com maior pontuação ao final da Maratona recebem prêmios especiais</li>
            <li>• Todos que completarem as 6 aulas recebem um certificado exclusivo de conclusão</li>
            <li>• Em caso de empate de pontos, o critério de desempate é a data do último check-in</li>
          </ul>
        </div>

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
