import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { calcPoints, calcAulaCount, getUserLevel } from '@/lib/points'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import LeaderboardClient from './LeaderboardClient'
import HomeStatsClient from './HomeStatsClient'
import HomeChallengeSection from './HomeChallengeSection'

export const dynamic = 'force-dynamic'

async function getLeaderboard() {
  const users = await prisma.user.findMany({
    where: { role: 'USER' },
    select: {
      id: true,
      name: true,
      showFirstNameOnly: true,
      checkIns: {
        select: { type: true, status: true, isInvalid: true },
      },
      pointAdjustments: { select: { amount: true } },
      finalChallenge: { select: { points: true } },
    },
  })

  return users
    .map((u) => ({
      id: u.id,
      name: u.showFirstNameOnly ? u.name.split(' ')[0] : u.name,
      points: calcPoints(u.checkIns, u.pointAdjustments, u.finalChallenge),
      aulaCount: calcAulaCount(u.checkIns),
    }))
    .sort((a, b) => b.points - a.points)
}

export default async function Home() {
  const session = await getSession()
  if (session) redirect('/dashboard')

  const [leaderboard, totalLives] = await Promise.all([
    getLeaderboard(),
    prisma.live.count(),
  ])

  const champions = leaderboard.filter((u) => u.aulaCount >= totalLives && totalLives > 0)
  const total = leaderboard.length

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black mb-3">
          Product<span className="text-violet-400">Rats</span>
        </h1>
        <p className="text-gray-400 max-w-md mx-auto leading-relaxed">
          O painel oficial da Maratona PM3. Complete as {totalLives > 0 ? totalLives : ''} aulas,
          registre seus insights, compartilhe no LinkedIn e acompanhe sua posição no ranking.
        </p>
        <HomeStatsClient total={total} champions={champions.length} totalLives={totalLives} />
      </div>

      {/* CTA */}
      <div className="flex gap-3 justify-center mb-10">
        <Link href="/cadastro" className="btn-primary">
          Participar da Maratona
        </Link>
        <Link href="/login" className="btn-secondary">
          Já tenho conta
        </Link>
      </div>

      {/* Two-column layout on desktop */}
      <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-8">

        {/* Left — Como funciona + Challenge + Leaderboard preview */}
        <div className="space-y-6 mb-6 lg:mb-0">
          {/* Como funciona */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-300 mb-3">Como funciona</h2>
            <ol className="space-y-2 text-sm text-gray-400">
              <li className="flex gap-2">
                <span className="text-violet-400 font-bold">1.</span>
                Assista a uma aula da série PM3
              </li>
              <li className="flex gap-2">
                <span className="text-violet-400 font-bold">2.</span>
                Escreva seu insight e faça o check-in{' '}
                <span className="text-gray-500">(🏁 +1 ponto)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-violet-400 font-bold">3.</span>
                Publique no LinkedIn e envie o link para ganhar bônus{' '}
                <span className="text-gray-500">(🚀 +3 pontos)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-violet-400 font-bold">4.</span>
                Complete as {totalLives > 0 ? totalLives : 'todas as'} aulas e concorra ao prêmio! 🏆
              </li>
            </ol>
          </div>

          {/* Challenge section */}
          <HomeChallengeSection />

          {/* Compact Leaderboard — top 5, first names only */}
          <LeaderboardClient
            leaderboard={leaderboard.map((u, i) => ({
              ...u,
              rank: i + 1,
              level: getUserLevel(u.aulaCount),
            }))}
            currentUserId={null}
            totalLives={totalLives}
            maxItems={5}
            firstNameOnly={true}
          />
        </div>

        {/* Right — Prizes (sticky on desktop) */}
        <div className="lg:sticky lg:top-20">
          <div className="card p-5 border-violet-800/40">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🏆</span>
              <h2 className="font-semibold text-white">Premiação</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2.5">
                <span className="text-lg shrink-0">🥇</span>
                <div>
                  <p className="text-xs font-bold text-yellow-400">1º lugar</p>
                  <p className="text-xs text-gray-300">Imersão Presencial em Empresa Product-Led</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-gray-500/10 border border-gray-500/20 rounded-lg px-3 py-2.5">
                <span className="text-lg shrink-0">🥈</span>
                <div>
                  <p className="text-xs font-bold text-gray-300">2º lugar</p>
                  <p className="text-xs text-gray-300">12 meses de acesso a 1 Formação PM3</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-amber-800/10 border border-amber-700/30 rounded-lg px-3 py-2.5">
                <span className="text-lg shrink-0">🥉</span>
                <div>
                  <p className="text-xs font-bold text-amber-500">3º lugar</p>
                  <p className="text-xs text-gray-300">Ingresso Presencial PM3 Summit 2026</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 pt-1">
                🎓 Todos que completarem as {totalLives > 0 ? totalLives : 'todas as'} aulas recebem Certificado de Participação.
              </p>
            </div>
          </div>

          <div className="mt-4 card p-4 border-gray-800/60">
            <div className="flex gap-3">
              <a href="/cadastro" className="btn-primary flex-1 text-sm">Criar conta grátis</a>
              <a href="/ranking" className="btn-secondary flex-1 text-sm">Ver ranking</a>
            </div>
          </div>
        </div>

      </div>{/* end two-column grid */}
    </div>
  )
}
