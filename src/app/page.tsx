import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { calcPoints, calcAulaCount, getUserLevel } from '@/lib/points'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import LeaderboardClient from './LeaderboardClient'
import HomeStatsClient from './HomeStatsClient'

export const dynamic = 'force-dynamic'

async function getLeaderboard() {
  const users = await prisma.user.findMany({
    where: { role: 'USER' },
    select: {
      id: true,
      name: true,
      checkIns: {
        select: { type: true, status: true, isInvalid: true },
      },
      pointAdjustments: { select: { amount: true } },
    },
  })

  return users
    .map((u) => ({
      id: u.id,
      name: u.name,
      points: calcPoints(u.checkIns, u.pointAdjustments),
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
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="text-5xl mb-4">🏋️</div>
        <h1 className="text-3xl font-bold mb-3">Product<span className="text-violet-400">Rats</span></h1>
        <p className="text-gray-400 max-w-md mx-auto leading-relaxed">
          O ProductRats é o seu painel oficial da Maratona PM3. Complete as {totalLives > 0 ? totalLives : ''} aulas, registre seus insights, compartilhe no LinkedIn e acompanhe sua posição no ranking. Os melhores colocados sobem ao pódio e levam prêmios! 🏆
        </p>
        <HomeStatsClient total={total} champions={champions.length} totalLives={totalLives} />
      </div>

      {/* CTA */}
      <div className="flex gap-3 justify-center mb-8">
        <Link href="/cadastro" className="btn-primary">
          Participar agora
        </Link>
        <Link href="/login" className="btn-secondary">
          Já tenho conta
        </Link>
      </div>

      {/* Como funciona */}
      <div className="card p-5 mb-6">
        <h2 className="font-semibold text-gray-300 mb-3">Como funciona</h2>
        <ol className="space-y-2 text-sm text-gray-400">
          <li className="flex gap-2">
            <span className="text-violet-400 font-bold">1.</span>
            Assista a uma aula da série PM3
          </li>
          <li className="flex gap-2">
            <span className="text-violet-400 font-bold">2.</span>
            Escreva seu insight e faça o check-in <span className="text-gray-500">(+1 ponto)</span>
          </li>
          <li className="flex gap-2">
            <span className="text-violet-400 font-bold">3.</span>
            Publique no LinkedIn e envie o link para ganhar bônus <span className="text-gray-500">(+3 pontos)</span>
          </li>
          <li className="flex gap-2">
            <span className="text-violet-400 font-bold">4.</span>
            Complete as {totalLives > 0 ? totalLives : 'todas as'} aulas e concorra ao prêmio! 🏆
          </li>
        </ol>
      </div>

      {/* Prize section */}
      <div className="card p-5 mb-8 border-violet-800/40">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">🏆</span>
          <h2 className="font-semibold text-white">Premiação da Maratona</h2>
        </div>
        <p className="text-gray-400 text-sm mb-3">
          Os 3 primeiros colocados recebem prêmios exclusivos PM3.
        </p>
        <Link
          href="/ranking"
          className="text-sm text-violet-400 hover:text-violet-300 underline transition-colors"
        >
          Ver detalhes da premiação →
        </Link>
      </div>

      {/* Leaderboard */}
      <LeaderboardClient
        leaderboard={leaderboard.map((u, i) => ({
          ...u,
          rank: i + 1,
          level: getUserLevel(u.aulaCount),
        }))}
        currentUserId={null}
        totalLives={totalLives}
      />
    </div>
  )
}
