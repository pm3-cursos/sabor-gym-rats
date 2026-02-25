import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import LeaderboardClient from './LeaderboardClient'

export const dynamic = 'force-dynamic'

export function getUserLevel(points: number) {
  if (points >= 6) return { label: 'Maratonista PM3', icon: '🥇', color: 'text-yellow-400' }
  if (points >= 3) return { label: 'Corredor', icon: '🥈', color: 'text-gray-300' }
  if (points >= 1) return { label: 'Iniciante', icon: '🥉', color: 'text-amber-500' }
  return { label: 'Na largada', icon: '🏁', color: 'text-gray-500' }
}

async function getLeaderboard() {
  const users = await prisma.user.findMany({
    where: { role: 'USER' },
    select: {
      id: true,
      name: true,
      checkIns: {
        where: { status: 'APPROVED' },
        select: { liveId: true },
      },
    },
  })

  return users
    .map((u) => ({ id: u.id, name: u.name, points: u.checkIns.length }))
    .sort((a, b) => b.points - a.points)
}

export default async function Home() {
  const [leaderboard, session, totalLives] = await Promise.all([
    getLeaderboard(),
    getSession(),
    prisma.live.count(),
  ])

  const champions = leaderboard.filter((u) => u.points >= totalLives && totalLives > 0)
  const total = leaderboard.length

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="text-5xl mb-4">🏋️</div>
        <h1 className="text-3xl font-bold mb-2">Product<span className="text-violet-400">Rats</span></h1>
        <p className="text-gray-400 max-w-md mx-auto">
          Assista às {totalLives > 0 ? totalLives : ''} aulas da série PM3, publique seu insight no LinkedIn e marque seu check-in.
          Quem completar todas concorre ao prêmio!
        </p>
        <div className="flex justify-center gap-6 mt-6 text-center">
          <div>
            <div className="text-2xl font-bold text-violet-400">{total}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">participantes</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400">{champions.length}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">completos 🏆</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-400">{totalLives}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">aulas no total</div>
          </div>
        </div>
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
      <div className="card p-5 mb-8">
        <h2 className="font-semibold text-gray-300 mb-3">Como funciona</h2>
        <ol className="space-y-2 text-sm text-gray-400">
          <li className="flex gap-2">
            <span className="text-violet-400 font-bold">1.</span>
            Assista a uma aula da série PM3
          </li>
          <li className="flex gap-2">
            <span className="text-violet-400 font-bold">2.</span>
            Escreva seu insight sobre o conteúdo
          </li>
          <li className="flex gap-2">
            <span className="text-violet-400 font-bold">3.</span>
            Publique no LinkedIn e envie o link aqui para ganhar 1 ponto
          </li>
          <li className="flex gap-2">
            <span className="text-violet-400 font-bold">4.</span>
            Complete as {totalLives > 0 ? totalLives : 'todas as'} aulas e concorra ao prêmio! 🏆
          </li>
        </ol>
      </div>

      {/* Leaderboard */}
      <LeaderboardClient
        leaderboard={leaderboard.map((u, i) => ({
          ...u,
          rank: i + 1,
          level: getUserLevel(u.points),
        }))}
        currentUserId={session?.userId ?? null}
        totalLives={totalLives}
      />
    </div>
  )
}
