import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import LeaderboardClient from '../LeaderboardClient'
import RulesModal from './RulesModal'
import { calcPoints, calcAulaCount, getUserLevel } from '@/lib/points'

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
    },
  })

  return users
    .map((u) => ({
      id: u.id,
      name: u.showFirstNameOnly ? u.name.split(' ')[0] : u.name,
      points: calcPoints(u.checkIns, u.pointAdjustments),
      aulaCount: calcAulaCount(u.checkIns),
    }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, 'pt-BR'))
}

const PRIZES = [
  {
    rank: 1,
    prize: 'Imersão Presencial em Empresa Product-Led',
    color: 'text-yellow-400',
    border: 'border-yellow-500/40',
    bg: 'bg-yellow-500/10',
    ring: 'ring-2 ring-yellow-500/60',
    platform: 'h-16',
    emoji: '🥇',
  },
  {
    rank: 2,
    prize: '12 meses de acesso a 1 Formação PM3',
    color: 'text-gray-300',
    border: 'border-gray-500/30',
    bg: 'bg-gray-500/10',
    ring: 'ring-2 ring-gray-500/40',
    platform: 'h-10',
    emoji: '🥈',
  },
  {
    rank: 3,
    prize: 'Ingresso Presencial PM3 Summit 2026',
    color: 'text-amber-600',
    border: 'border-amber-800/30',
    bg: 'bg-amber-800/10',
    ring: 'ring-2 ring-amber-700/40',
    platform: 'h-7',
    emoji: '🥉',
  },
]

function PodiumSection({
  leaderboard,
  currentUserId,
}: {
  leaderboard: { id: string; name: string; points: number; aulaCount: number }[]
  currentUserId: string | null
}) {
  const podiumOrder = [1, 0, 2]

  return (
    <div className="card p-5 mb-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-white">🏆 Pódio & Premiação</h2>
        <span className="text-xs text-gray-600">Top 3</span>
      </div>

      <div className="flex items-end justify-center gap-3 mb-6">
        {podiumOrder.map((prizeIndex) => {
          const p = PRIZES[prizeIndex]
          const user = leaderboard[prizeIndex]
          const initial = user ? user.name.charAt(0).toUpperCase() : '?'
          const isFirst = p.rank === 1
          const isCurrentUser = user && currentUserId && user.id === currentUserId

          return (
            <div
              key={p.rank}
              className={`flex flex-col items-center ${isFirst ? 'order-2' : prizeIndex === 1 ? 'order-1' : 'order-3'}`}
              style={{ minWidth: 0, flex: '1 1 0' }}
            >
              <div className="flex flex-col items-center mb-2 px-1">
                <div
                  className={`w-12 h-12 rounded-full ${p.bg} ${p.ring} flex items-center justify-center text-lg font-bold ${p.color} mb-1.5 ${isFirst ? 'w-14 h-14' : ''} ${isCurrentUser ? 'ring-violet-400' : ''}`}
                >
                  {user ? initial : '—'}
                </div>
                <p
                  className={`text-xs font-semibold text-center leading-tight truncate w-full max-w-[80px] ${isFirst ? 'text-white' : 'text-gray-300'} ${isCurrentUser ? 'text-violet-300' : ''}`}
                >
                  {user ? user.name.split(' ')[0] : '—'}
                  {isCurrentUser && <span className="block text-violet-400 text-[10px]">(você)</span>}
                </p>
                <p className={`text-sm font-bold tabular-nums mt-0.5 ${p.color}`}>
                  {user ? `${user.points} pts` : '—'}
                </p>
              </div>

              <div
                className={`w-full ${p.platform} ${p.bg} border ${p.border} rounded-t-lg flex items-start justify-center pt-1.5`}
              >
                <span className="text-lg">{p.emoji}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Prize list */}
      <div className="space-y-2">
        {PRIZES.map((p) => (
          <div key={p.rank} className={`flex items-start gap-3 ${p.bg} border ${p.border} rounded-lg px-3 py-2.5`}>
            <span className="text-xl shrink-0 mt-0.5">{p.emoji}</span>
            <div className="min-w-0">
              <p className={`text-xs font-bold ${p.color}`}>{p.rank}º lugar</p>
              <p className="text-xs text-gray-300 leading-snug">{p.prize}</p>
            </div>
            {leaderboard[p.rank - 1] && (
              <p className={`text-xs font-semibold ml-auto shrink-0 ${p.color}`}>
                {leaderboard[p.rank - 1].name.split(' ')[0]}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default async function RankingPage() {
  const [leaderboard, session, totalLives] = await Promise.all([
    getLeaderboard(),
    getSession(),
    prisma.live.count(),
  ])

  const total = leaderboard.length
  const champions = leaderboard.filter((u) => u.aulaCount >= totalLives && totalLives > 0)

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

      {/* Podium + Prizes */}
      <PodiumSection leaderboard={leaderboard} currentUserId={session?.userId ?? null} />

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
          level: getUserLevel(u.aulaCount),
        }))}
        currentUserId={session?.userId ?? null}
        totalLives={totalLives}
      />

      {!session && (
        <div className="mt-8 card p-6 text-center border-violet-800/50 bg-violet-500/5">
          <div className="text-3xl mb-3">🏁</div>
          <h3 className="font-bold text-lg mb-1">Quer aparecer no ranking?</h3>
          <p className="text-sm text-gray-400 mb-4">
            Cadastre-se gratuitamente, assista às aulas e concorra a prêmios incríveis!
          </p>
          <div className="flex gap-3 justify-center">
            <a href="/cadastro" className="btn-primary">Criar conta grátis</a>
            <a href="/login" className="btn-secondary">Entrar</a>
          </div>
        </div>
      )}
    </div>
  )
}
