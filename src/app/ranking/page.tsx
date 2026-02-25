import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import LeaderboardClient from '../LeaderboardClient'
import RulesModal from './RulesModal'

export const dynamic = 'force-dynamic'

function getUserLevel(points: number) {
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

export default async function RankingPage() {
  const [leaderboard, session, totalLives] = await Promise.all([
    getLeaderboard(),
    getSession(),
    prisma.live.count(),
  ])

  const total = leaderboard.length
  const champions = leaderboard.filter((u) => u.points >= totalLives && totalLives > 0)

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold mb-1">Ranking da Maratona</h1>
            <p className="text-gray-400 text-sm">
              {total} participante{total !== 1 ? 's' : ''} · {champions.length} completo{champions.length !== 1 ? 's' : ''}
            </p>
          </div>
          <RulesModal />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-violet-400">{total}</div>
          <div className="text-xs text-gray-500 mt-1">participantes</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">{champions.length}</div>
          <div className="text-xs text-gray-500 mt-1">completos 🏆</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-amber-400">{totalLives}</div>
          <div className="text-xs text-gray-500 mt-1">aulas no total</div>
        </div>
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

      {!session && (
        <p className="text-center text-sm text-gray-500 mt-6">
          <a href="/cadastro" className="text-violet-400 hover:text-violet-300">Cadastre-se</a>
          {' '}para participar e aparecer no ranking!
        </p>
      )}
    </div>
  )
}
