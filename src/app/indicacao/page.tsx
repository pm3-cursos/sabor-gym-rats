import Link from 'next/link'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function IndicacaoPage() {
  const [session, upviralUrlSetting] = await Promise.all([
    getSession(),
    prisma.appSettings.findUnique({ where: { key: 'upviralUrl' } }),
  ])

  const upviralUrl = upviralUrlSetting?.value || null

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-6">
        <Link href={session ? '/dashboard' : '/'} className="text-sm text-gray-500 hover:text-violet-400 transition-colors">
          ← Voltar
        </Link>
      </div>

      <div className="mb-8">
        <p className="text-xs text-amber-400 font-medium uppercase tracking-wide mb-1">Campanha de Indicação</p>
        <h1 className="text-2xl font-bold mb-2">Indique um amigo e ganhe prêmios!</h1>
        <p className="text-sm text-gray-400">Válido de <strong className="text-gray-200">04/03/2026</strong> a <strong className="text-gray-200">24/03/2026</strong></p>
      </div>

      {upviralUrl && (
        <div className="card p-6 mb-6 border-amber-600/40 bg-amber-500/5">
          <h2 className="font-semibold text-lg mb-2">🔗 Seu link de indicação</h2>
          <p className="text-sm text-gray-400 mb-4">
            Acesse a plataforma de indicação para obter seu link exclusivo e acompanhar suas indicações em tempo real.
          </p>
          <a
            href={upviralUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            Acessar meu link de indicação →
          </a>
        </div>
      )}

      <div className="space-y-5">

        {/* How it works */}
        <div className="card p-6">
          <h2 className="font-semibold text-lg mb-3">Como funciona</h2>
          <ol className="space-y-3 text-sm text-gray-400">
            <li className="flex gap-3">
              <span className="font-bold text-amber-400 shrink-0">1.</span>
              <span>Acesse a campanha de indicação pelo botão acima e obtenha seu link exclusivo de indicação.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-amber-400 shrink-0">2.</span>
              <span>Compartilhe seu link com amigos e colegas que ainda não participam da Maratona PM3.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-amber-400 shrink-0">3.</span>
              <span>Cada pessoa que se cadastrar usando seu link conta como 1 ponto no ranking de indicações.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-amber-400 shrink-0">4.</span>
              <span>Acumule indicações e concorra aos prêmios exclusivos da campanha!</span>
            </li>
          </ol>
        </div>

        {/* Meta prize */}
        <div className="card p-6 border-emerald-600/30 bg-emerald-500/5">
          <h2 className="font-semibold text-lg mb-3">🎯 Meta de Indicação</h2>
          <p className="text-sm text-gray-400 mb-3">
            Alcance <strong className="text-white">3 indicações válidas</strong> e ganhe automaticamente:
          </p>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3">
            <p className="text-sm font-semibold text-emerald-300">Acesso gratuito à aula</p>
            <p className="text-base font-bold text-white">&ldquo;Roadmap Estratégico com IA&rdquo;</p>
            <p className="text-xs text-emerald-400 mt-1">Valor: R$ 270,00 — liberado gratuitamente ao atingir a meta</p>
          </div>
          <p className="text-xs text-gray-500 mt-3">Este prêmio é cumulativo com os prêmios de colocação.</p>
        </div>

        {/* Ranking prizes */}
        <div className="card p-6">
          <h2 className="font-semibold text-lg mb-4">🏆 Prêmios por Colocação</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-3">
              <span className="text-2xl shrink-0">🥇</span>
              <div>
                <p className="text-sm font-bold text-yellow-400">1º lugar</p>
                <p className="text-sm text-gray-300">12 meses de Membership PM3</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-gray-500/10 border border-gray-500/20 rounded-lg px-4 py-3">
              <span className="text-2xl shrink-0">🥈</span>
              <div>
                <p className="text-sm font-bold text-gray-300">2º lugar</p>
                <p className="text-sm text-gray-300">12 meses de Combo AI Product</p>
                <p className="text-xs text-gray-500 mt-0.5">AI Product Specialist + Formação PM + Formação Product Discovery</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-amber-800/10 border border-amber-800/20 rounded-lg px-4 py-3">
              <span className="text-2xl shrink-0">🥉</span>
              <div>
                <p className="text-sm font-bold text-amber-600">3º lugar</p>
                <p className="text-sm text-gray-300">12 meses de Sprints PM3</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">Os prêmios de 1º, 2º e 3º lugar não são cumulativos entre si. Em caso de empate, vence quem atingiu a pontuação primeiro.</p>
        </div>

        {/* Rules */}
        <div className="card p-6">
          <h2 className="font-semibold text-lg mb-3">📋 Regras Importantes</h2>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>• Apenas cadastros realizados pelo seu link exclusivo da campanha de indicação são contabilizados.</li>
            <li>• As indicações são verificadas automaticamente pelo sistema EmailList Verify.</li>
            <li>• E-mails inválidos não são contabilizados. Se mais de <strong className="text-gray-200">10%</strong> das suas indicações forem inválidas, você é desclassificado.</li>
            <li>• É proibido inscrever terceiros sem consentimento, usar listas compradas ou práticas automatizadas.</li>
            <li>• Influenciadores, colaboradores da PM3, Alura e FIAP não concorrem aos prêmios de colocação.</li>
            <li>• Participantes premiados em campanhas PM3 nos últimos 12 meses são desclassificados automaticamente.</li>
            <li>• Os prêmios digitais são entregues em até <strong className="text-gray-200">10 dias úteis</strong> após o fim da campanha.</li>
          </ul>
        </div>

        {/* Delivery */}
        <div className="card p-6">
          <h2 className="font-semibold text-lg mb-3">📦 Entrega dos Prêmios</h2>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>• Prêmios digitais liberados em até <strong className="text-gray-200">10 dias úteis</strong> após 24/03/2026.</li>
            <li>• O contato será feito pelo e-mail cadastrado na Maratona PM3.</li>
            <li>• O participante tem <strong className="text-gray-200">7 dias corridos</strong> para responder ao contato, caso contrário poderá perder o direito ao prêmio.</li>
          </ul>
        </div>


      </div>
    </div>
  )
}
