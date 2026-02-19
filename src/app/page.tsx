import { prisma } from '@/lib/db'
import Link from 'next/link'

export const revalidate = 60

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

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-2xl">🥇</span>
  if (rank === 2) return <span className="text-2xl">🥈</span>
  if (rank === 3) return <span className="text-2xl">🥉</span>
  return (
    <span className="w-8 h-8 flex items-center justify-center text-sm font-bold text-gray-500">
      {rank}
    </span>
  )
}

function ProgressBar({ points }: { points: number }) {
  const pct = Math.round((points / 8) * 100)
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            points >= 8 ? 'bg-emerald-500' : 'bg-violet-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-sm font-bold tabular-nums shrink-0 ${points >= 8 ? 'text-emerald-400' : 'text-white'}`}>
        {points}/8
      </span>
    </div>
  )
}

export default async function Home() {
  const leaderboard = await getLeaderboard()
  const champions = leaderboard.filter((u) => u.points >= 8)
  const total = leaderboard.length

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="text-5xl mb-4">🏋️</div>
        <h1 className="text-3xl font-bold mb-2">PM3 Gymrats</h1>
        <p className="text-gray-400 max-w-md mx-auto">
          Assista às 8 lives de março, publique no LinkedIn e marque seu check-in.
          Quem completar todas ganha um prêmio!
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
            <div className="text-2xl font-bold text-amber-400">8</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">lives no total</div>
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
            Assista a uma live da série PM3 de março
          </li>
          <li className="flex gap-2">
            <span className="text-violet-400 font-bold">2.</span>
            Publique algo sobre ela no LinkedIn
          </li>
          <li className="flex gap-2">
            <span className="text-violet-400 font-bold">3.</span>
            Envie o link da publicação aqui para ganhar 1 ponto
          </li>
          <li className="flex gap-2">
            <span className="text-violet-400 font-bold">4.</span>
            Complete as 8 lives e concorra ao prêmio! 🏆
          </li>
        </ol>
      </div>

      {/* Leaderboard */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="font-semibold">Placar</h2>
          {total === 0 && <span className="text-xs text-gray-600">Nenhum participante ainda</span>}
        </div>

        {leaderboard.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-600">
            <div className="text-4xl mb-3">🏁</div>
            <p>Seja o primeiro a se cadastrar!</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-800/60">
            {leaderboard.map((user, i) => (
              <li
                key={user.id}
                className={`px-5 py-4 flex items-center gap-4 ${
                  user.points >= 8 ? 'bg-emerald-500/5' : ''
                }`}
              >
                <RankBadge rank={i + 1} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">{user.name}</span>
                    {user.points >= 8 && (
                      <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium shrink-0">
                        🏆 Completo
                      </span>
                    )}
                  </div>
                  <ProgressBar points={user.points} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
